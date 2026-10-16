import os
import sys
import re
import json
import time
from urllib.parse import urljoin, urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from bs4 import BeautifulSoup
import urllib3
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://www.indcareer.com"
LIST_URL = "https://www.indcareer.com/find/all-colleges-in-orissa"
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

CHECKPOINT_LIST = os.path.join(DATA_DIR, "checkpoint_listing.json")
CHECKPOINT_DETAILS = os.path.join(DATA_DIR, "checkpoint_details.json")
CHECKPOINT_WEBSITES = os.path.join(DATA_DIR, "checkpoint_websites.json")
OUTPUT_EXCEL = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Orissa_Colleges_Complete_Email_Directory.xlsx"))

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
IGNORE_EMAIL_EXTS = ('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js', '.woff', '.ttf', '.ico', '.bmp', '.mp4', '.pdf')
IGNORE_EMAIL_DOMAINS = (
    'example.com', 'domain.com', 'yourdomain', 'sentry.io', 'w3.org', 'schema.org', 
    'email.com', 'test.com', 'mysite.com', 'sample.com', 'google.com'
)

def decode_cf_val(hex_str):
    try:
        key = int(hex_str[:2], 16)
        return ''.join([chr(int(hex_str[i:i+2], 16) ^ key) for i in range(2, len(hex_str), 2)])
    except Exception:
        return ''

def decode_soup_cf_emails(soup):
    for a in soup.find_all(attrs={'data-cfemail': True}):
        email = decode_cf_val(a['data-cfemail'])
        if email:
            a.replace_with(email)
    for a in soup.find_all('a', href=True):
        if '/cdn-cgi/l/email-protection#' in a['href']:
            hex_str = a['href'].split('#')[-1]
            email = decode_cf_val(hex_str)
            if email:
                a.replace_with(email)

def clean_email(email_str):
    if not email_str:
        return None
    e = email_str.strip().lower()
    for ext in IGNORE_EMAIL_EXTS:
        if e.endswith(ext):
            return None
    for dom in IGNORE_EMAIL_DOMAINS:
        if dom in e:
            return None
    if len(e) < 6 or '.' not in e.split('@')[-1]:
        return None
    return e

def extract_all_emails_from_soup(soup, raw_html=""):
    found = set()
    decode_soup_cf_emails(soup)
    
    # 1. Check mailto:
    for a in soup.find_all('a', href=True):
        href = a['href']
        if href.lower().startswith('mailto:'):
            raw = href[7:].split('?')[0]
            for part in re.split(r'[,;]', raw):
                ce = clean_email(part)
                if ce:
                    found.add(ce)

    # 2. Regex on visible text
    text = soup.get_text(" ", strip=True)
    for m in EMAIL_REGEX.findall(text):
        ce = clean_email(m)
        if ce:
            found.add(ce)
            
    # 3. Regex on raw html if provided
    if raw_html:
        for m in EMAIL_REGEX.findall(raw_html):
            ce = clean_email(m)
            if ce:
                found.add(ce)
                
    return found

# -------------------------------------------------------------
# STEP 1: Listing Pages Scraping (All 59 pages)
# -------------------------------------------------------------
def fetch_listing_page(page_num, session):
    url = f"{LIST_URL}?page={page_num}"
    try:
        r = session.get(url, headers=HEADERS, timeout=20)
        if r.status_code != 200:
            return []
        soup = BeautifulSoup(r.text, 'html.parser')
        colleges = []
        
        for article in soup.find_all(['article', 'div'], class_=lambda c: c and 'college-card' in c):
            h2 = article.find(['h2', 'h3'])
            if not h2:
                continue
            name = h2.get_text(strip=True)
            link = h2.find('a')
            profile_url = ""
            if link and link.get('href'):
                profile_url = urljoin(BASE_URL, link['href'])
            
            location = ""
            for p in article.find_all(['p', 'div', 'span'], class_=lambda c: c and any(x in c.lower() for x in ['location', 'city', 'address', 'district'])):
                txt = p.get_text(strip=True)
                if txt and 'odisha' in txt.lower():
                    location = txt
                    break
                    
            colleges.append({
                'name': name,
                'profile_url': profile_url,
                'location_preview': location,
                'page': page_num
            })
            
        if not colleges:
            for h2 in soup.find_all('h2'):
                name = h2.get_text(strip=True)
                if name in ['Filter Colleges', 'Search Colleges', '']:
                    continue
                a = h2.find('a')
                if a and a.get('href') and ('/orissa/' in a['href'] or '/odisha/' in a['href']):
                    profile_url = urljoin(BASE_URL, a['href'])
                    colleges.append({
                        'name': name,
                        'profile_url': profile_url,
                        'location_preview': '',
                        'page': page_num
                    })
        return colleges
    except Exception as e:
        print(f"Error fetching listing page {page_num}: {e}")
        return []

def get_all_colleges_list():
    if os.path.exists(CHECKPOINT_LIST):
        with open(CHECKPOINT_LIST, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if len(data) >= 1100:
                print(f"[STEP 1] Loaded {len(data)} colleges from cache.")
                return data

    print("[STEP 1] Fetching all 59 pages from IndCareer...")
    all_colleges = []
    seen_urls = set()
    
    with requests.Session() as session:
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {executor.submit(fetch_listing_page, p, session): p for p in range(1, 60)}
            for future in as_completed(futures):
                cols = future.result()
                for c in cols:
                    if c['profile_url'] not in seen_urls:
                        seen_urls.add(c['profile_url'])
                        all_colleges.append(c)
                        
    all_colleges.sort(key=lambda x: x['name'])
    print(f"[STEP 1] Done! Found {len(all_colleges)} unique colleges.")
    with open(CHECKPOINT_LIST, 'w', encoding='utf-8') as f:
        json.dump(all_colleges, f, ensure_ascii=False, indent=2)
    return all_colleges

# -------------------------------------------------------------
# STEP 2: IndCareer Detail Pages Scraping (All 1,174 colleges)
# -------------------------------------------------------------
def scrape_college_detail(college, session):
    url = college['profile_url']
    if not url:
        return college
        
    res = dict(college)
    res['official_website'] = ''
    res['indcareer_email'] = ''
    res['phone'] = ''
    res['address'] = ''
    res['city_district'] = college.get('location_preview', '')
    res['affiliated_to'] = ''

    try:
        r = session.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return res
            
        soup = BeautifulSoup(r.text, 'html.parser')
        decode_soup_cf_emails(soup)

        # Contact section
        for row in soup.find_all('div', class_=lambda c: c and 'contact-data-row' in c):
            lbl = row.find(class_=lambda c: c and 'contact-label' in c)
            lbl_txt = lbl.get_text(strip=True).lower() if lbl else ''
            
            if 'website' in lbl_txt:
                a_tag = row.find('a', href=True)
                if a_tag and a_tag['href']:
                    href = a_tag['href'].strip()
                    if href.startswith('http') or href.startswith('www.'):
                        res['official_website'] = href
            elif 'email' in lbl_txt:
                val = row.find(class_=lambda c: c and 'contact-value' in c) or row
                email_candidate = clean_email(val.get_text(strip=True).replace('Official Email', '').strip())
                if email_candidate:
                    res['indcareer_email'] = email_candidate
            elif 'phone' in lbl_txt or 'telephone' in lbl_txt:
                val = row.find(class_=lambda c: c and 'contact-value' in c) or row
                res['phone'] = val.get_text(" ", strip=True).replace('Telephone Helpline', '').strip()
            elif 'address' in lbl_txt:
                val = row.find(class_=lambda c: c and 'contact-value' in c)
                addr_text = val.get_text(" ", strip=True) if val else ''
                city_elem = row.find(class_=lambda c: c and 'text-muted' in c)
                if city_elem:
                    city_text = city_elem.get_text(strip=True)
                    addr_text += " (" + city_text + ")"
                    if 'City:' in city_text:
                        parts = city_text.split('|')
                        city_part = parts[0].replace('City:', '').strip()
                        if city_part:
                            res['city_district'] = city_part
                res['address'] = addr_text
            elif 'affiliat' in lbl_txt:
                val = row.find(class_=lambda c: c and 'contact-value' in c) or row
                res['affiliated_to'] = val.get_text(" ", strip=True).replace('Affiliated To', '').replace('Affiliated University', '').strip()

        # Fallback for website if not in contact-data-row
        if not res['official_website']:
            for a in soup.find_all('a', href=True):
                href = a['href']
                if any(x in href.lower() for x in ['.ac.in', '.edu.in', '.nic.in', '.org.in', '.res.in']):
                    if 'indcareer' not in href:
                        res['official_website'] = href
                        break

        # Fallback for email if not found in row
        if not res['indcareer_email']:
            all_emails = extract_all_emails_from_soup(soup, r.text)
            for em in all_emails:
                if 'indcareer' not in em:
                    res['indcareer_email'] = em
                    break

        return res
    except Exception as e:
        return res

def get_all_colleges_details(colleges):
    cached = {}
    if os.path.exists(CHECKPOINT_DETAILS):
        try:
            with open(CHECKPOINT_DETAILS, 'r', encoding='utf-8') as f:
                data = json.load(f)
                cached = {item['profile_url']: item for item in data if 'profile_url' in item}
                print(f"[STEP 2] Loaded {len(cached)} college details from cache.")
        except Exception:
            cached = {}

    to_scrape = [c for c in colleges if c['profile_url'] not in cached]
    print(f"[STEP 2] Fetching detail pages: {len(to_scrape)} to fetch ({len(cached)} already cached)...")

    if to_scrape:
        with requests.Session() as session:
            with ThreadPoolExecutor(max_workers=20) as executor:
                futures = {executor.submit(scrape_college_detail, c, session): c for c in to_scrape}
                done_count = 0
                for future in as_completed(futures):
                    res = future.result()
                    cached[res['profile_url']] = res
                    done_count += 1
                    if done_count % 50 == 0 or done_count == len(to_scrape):
                        print(f"  Processed {done_count}/{len(to_scrape)} detail pages...")
                        # periodic save
                        with open(CHECKPOINT_DETAILS, 'w', encoding='utf-8') as f:
                            json.dump(list(cached.values()), f, ensure_ascii=False, indent=2)

    all_details = [cached.get(c['profile_url'], c) for c in colleges]
    with open(CHECKPOINT_DETAILS, 'w', encoding='utf-8') as f:
        json.dump(all_details, f, ensure_ascii=False, indent=2)
    print(f"[STEP 2] Completed! Total detailed colleges: {len(all_details)}")
    return all_details

# -------------------------------------------------------------
# STEP 3: Official College Website Crawling & Email Discovery
# -------------------------------------------------------------
KEYWORD_LEADERSHIP = re.compile(r'\b(principal|dean|director|provost|chancellor|vice chancellor|vc|headmaster|headmistress|chairman|president)\b', re.I)
KEYWORD_HOD = re.compile(r'\b(hod|head of department|head of dept|dept head|head)\b', re.I)
KEYWORD_FACULTY = re.compile(r'\b(faculty|professor|prof|lecturer|teacher|staff|assistant professor|associate professor|dr\.|dept|department)\b', re.I)

def classify_email(email_str, context_text=""):
    e_low = email_str.lower()
    ctx_low = context_text.lower()
    
    # 1. Leadership (Principal / Dean / Director)
    if any(k in e_low for k in ['principal', 'dean', 'director', 'provost', 'vc@', 'vicechancellor']):
        return "Leadership / Principal / Dean"
    if KEYWORD_LEADERSHIP.search(ctx_low) and not KEYWORD_HOD.search(ctx_low):
        return "Leadership / Principal / Dean"

    # 2. HOD
    if 'hod' in e_low or 'head' in e_low:
        return "HOD (Head of Department)"
    if KEYWORD_HOD.search(ctx_low):
        return "HOD (Head of Department)"

    # 3. Faculty / Department Staff
    if any(k in e_low for k in ['prof', 'faculty', 'teacher', 'lecturer', 'cs@', 'it@', 'mech@', 'civil@', 'phy@', 'chem@', 'math@']):
        return "Department Staff / Faculty"
    if KEYWORD_FACULTY.search(ctx_low):
        return "Department Staff / Faculty"

    # 4. General / Official
    if any(k in e_low for k in ['info', 'contact', 'admin', 'office', 'admissions', 'admission', 'support', 'helpdesk', 'enquiry', 'query', 'mail', 'feedback']):
        return "General / Official"

    # Default to general
    return "Official / Staff"

def crawl_official_website(website_url):
    if not website_url or not isinstance(website_url, str):
        return {'status': 'No Website Listed', 'emails': {}, 'all_emails': []}

    url = website_url.strip()
    if not url.startswith('http://') and not url.startswith('https://'):
        url = 'http://' + url

    session = requests.Session()
    discovered_emails = {} # email -> {'category': cat, 'source': page_url}
    
    try:
        domain = urlparse(url).netloc
        if not domain:
            return {'status': 'Invalid URL', 'emails': {}, 'all_emails': []}
            
        # 1. Fetch Home Page
        home_r = session.get(url, headers=HEADERS, timeout=8, verify=False, allow_redirects=True)
        final_url = home_r.url
        domain = urlparse(final_url).netloc
        home_soup = BeautifulSoup(home_r.text, 'html.parser')
        
        # Extract emails from home page
        decode_soup_cf_emails(home_soup)
        home_emails = extract_all_emails_from_soup(home_soup, home_r.text)
        for em in home_emails:
            cat = classify_email(em, home_r.text[:5000])
            discovered_emails[em] = {'category': cat, 'source': final_url}

        # 2. Discover relevant subpages
        subpages_to_crawl = []
        seen_links = {final_url.rstrip('/')}
        
        priority_keywords = [
            'contact', 'faculty', 'department', 'staff', 'dean', 'hod', 
            'principal', 'director', 'administration', 'people', 'team',
            'about', 'academic', 'management'
        ]
        
        for a in home_soup.find_all('a', href=True):
            href = a['href'].strip()
            text = a.get_text(" ", strip=True).lower()
            full_sub_url = urljoin(final_url, href)
            p = urlparse(full_sub_url)
            
            # Check domain
            if p.netloc and (domain in p.netloc or p.netloc in domain):
                path_lower = p.path.lower()
                clean_full = full_sub_url.split('#')[0].rstrip('/')
                
                if clean_full in seen_links:
                    continue
                if any(clean_full.endswith(ext) for ext in ['.pdf', '.jpg', '.png', '.doc', '.docx', '.zip', '.rar', '.mp4']):
                    continue
                    
                # Match keywords
                is_target = any(k in text for k in priority_keywords) or any(k in path_lower for k in priority_keywords)
                if is_target:
                    seen_links.add(clean_full)
                    # Priority score
                    score = 0
                    if any(k in path_lower or k in text for k in ['contact', 'principal', 'dean', 'hod', 'faculty', 'staff']):
                        score = 2
                    elif any(k in path_lower or k in text for k in ['department', 'administration', 'people']):
                        score = 1
                    subpages_to_crawl.append((score, full_sub_url))

        # Sort by score descending and take top 5 subpages
        subpages_to_crawl.sort(key=lambda x: x[0], reverse=True)
        top_subpages = [url for score, url in subpages_to_crawl[:5]]

        for sub_url in top_subpages:
            try:
                sr = session.get(sub_url, headers=HEADERS, timeout=7, verify=False)
                if sr.status_code == 200:
                    sub_soup = BeautifulSoup(sr.text, 'html.parser')
                    decode_soup_cf_emails(sub_soup)
                    sub_emails = extract_all_emails_from_soup(sub_soup, sr.text)
                    for em in sub_emails:
                        if em not in discovered_emails:
                            # Context search around email in text
                            ctx = ""
                            sub_text = sub_soup.get_text(" ", strip=True)
                            pos = sub_text.find(em)
                            if pos != -1:
                                start = max(0, pos - 150)
                                end = min(len(sub_text), pos + 150)
                                ctx = sub_text[start:end]
                            else:
                                ctx = sub_url
                            cat = classify_email(em, ctx)
                            discovered_emails[em] = {'category': cat, 'source': sub_url}
            except Exception:
                continue

        status_str = f"Live ({len(discovered_emails)} emails)" if discovered_emails else "Live (No emails displayed)"
        return {
            'status': status_str,
            'emails': discovered_emails,
            'all_emails': sorted(list(discovered_emails.keys()))
        }
    except Exception as e:
        err_msg = str(e)
        if 'ConnectTimeout' in err_msg or 'timed out' in err_msg:
            status = 'Connection Timed Out'
        elif 'SSLError' in err_msg:
            status = 'SSL Error'
        elif 'ConnectionRefused' in err_msg:
            status = 'Connection Refused'
        else:
            status = f"Unreachable"
        return {'status': status, 'emails': {}, 'all_emails': []}

def crawl_all_websites(colleges_details):
    cached = {}
    if os.path.exists(CHECKPOINT_WEBSITES):
        try:
            with open(CHECKPOINT_WEBSITES, 'r', encoding='utf-8') as f:
                cached = json.load(f)
                print(f"[STEP 3] Loaded {len(cached)} website crawl results from cache.")
        except Exception:
            cached = {}

    # Identify which colleges have websites to crawl
    to_crawl = []
    for c in colleges_details:
        w = c.get('official_website', '').strip()
        if w and w not in cached:
            to_crawl.append(w)
            
    # Deduplicate websites
    to_crawl = list(set(to_crawl))
    print(f"[STEP 3] Crawling official websites: {len(to_crawl)} websites to crawl ({len(cached)} cached)...")

    if to_crawl:
        with ThreadPoolExecutor(max_workers=15) as executor:
            futures = {executor.submit(crawl_official_website, w): w for w in to_crawl}
            done_count = 0
            for future in as_completed(futures):
                w = futures[future]
                res = future.result()
                cached[w] = res
                done_count += 1
                if done_count % 30 == 0 or done_count == len(to_crawl):
                    print(f"  Crawled {done_count}/{len(to_crawl)} websites...")
                    with open(CHECKPOINT_WEBSITES, 'w', encoding='utf-8') as f:
                        json.dump(cached, f, ensure_ascii=False, indent=2)

    with open(CHECKPOINT_WEBSITES, 'w', encoding='utf-8') as f:
        json.dump(cached, f, ensure_ascii=False, indent=2)
    print(f"[STEP 3] Completed website crawling!")
    return cached

# -------------------------------------------------------------
# STEP 4: Merge, Categorize & Export to Excel (.xlsx)
# -------------------------------------------------------------
def build_excel_report(colleges_details, website_results):
    print(f"[STEP 4] Formatting and generating Excel file at: {OUTPUT_EXCEL}")
    
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    # Styles
    navy_fill = PatternFill(start_color="1F497D", end_color="1F497D", fill_type="solid")
    dark_blue_fill = PatternFill(start_color="244062", end_color="244062", fill_type="solid")
    light_blue_fill = PatternFill(start_color="DCE6F1", end_color="DCE6F1", fill_type="solid")
    zebra_fill = PatternFill(start_color="F2F5F8", end_color="F2F5F8", fill_type="solid")
    white_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
    accent_green_fill = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")
    
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    bold_font = Font(name="Calibri", size=11, bold=True)
    normal_font = Font(name="Calibri", size=10)
    title_font = Font(name="Calibri", size=16, bold=True, color="1F497D")
    subtitle_font = Font(name="Calibri", size=11, italic=True, color="595959")
    
    thin_border_side = Side(border_style="thin", color="D9D9D9")
    cell_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    
    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)

    master_rows = []
    flat_staff_rows = []
    colleges_with_emails_rows = []

    total_websites_listed = 0
    total_emails_found = 0
    total_colleges_with_any_email = 0
    cat_counts = {
        'dean_principal': 0,
        'hod': 0,
        'faculty': 0,
        'general': 0
    }

    for idx, col in enumerate(colleges_details, 1):
        name = col.get('name', '').strip()
        location = col.get('city_district', '').strip()
        profile_url = col.get('profile_url', '').strip()
        website = col.get('official_website', '').strip()
        ind_email = col.get('indcareer_email', '').strip()
        phone = col.get('phone', '').strip()
        address = col.get('address', '').strip()
        affiliated_to = col.get('affiliated_to', '').strip()

        if website:
            total_websites_listed += 1

        w_info = website_results.get(website, {})
        w_status = w_info.get('status', 'No Website Listed' if not website else 'Not Crawled')
        site_emails_dict = w_info.get('emails', {})

        # Categorize
        dean_emails = []
        hod_emails = []
        faculty_emails = []
        general_emails = []
        all_emails_set = set()

        # Add indcareer official email
        if ind_email:
            all_emails_set.add(ind_email)
            cat = classify_email(ind_email, "IndCareer Official College Email")
            if "Principal" in cat or "Dean" in cat:
                dean_emails.append(ind_email)
            elif "HOD" in cat:
                hod_emails.append(ind_email)
            elif "Faculty" in cat:
                faculty_emails.append(ind_email)
            else:
                general_emails.append(ind_email)

        # Add crawled emails from website
        for em, meta in site_emails_dict.items():
            all_emails_set.add(em)
            cat = meta.get('category', '')
            src = meta.get('source', website)
            flat_staff_rows.append({
                'college_name': name,
                'location': location,
                'website': website,
                'category': cat,
                'email': em,
                'source_url': src
            })
            if "Principal" in cat or "Dean" in cat:
                if em not in dean_emails:
                    dean_emails.append(em)
            elif "HOD" in cat:
                if em not in hod_emails:
                    hod_emails.append(em)
            elif "Faculty" in cat or "Staff" in cat:
                if em not in faculty_emails:
                    faculty_emails.append(em)
            else:
                if em not in general_emails:
                    general_emails.append(em)

        cat_counts['dean_principal'] += len(dean_emails)
        cat_counts['hod'] += len(hod_emails)
        cat_counts['faculty'] += len(faculty_emails)
        cat_counts['general'] += len(general_emails)

        all_emails_list = sorted(list(all_emails_set))
        total_emails_found += len(all_emails_list)
        if all_emails_list:
            total_colleges_with_any_email += 1

        row_data = [
            idx,
            name,
            location,
            website,
            ind_email,
            "\n".join(dean_emails),
            "\n".join(hod_emails),
            "\n".join(faculty_emails),
            "\n".join(general_emails),
            ", ".join(all_emails_list),
            len(all_emails_list),
            phone,
            address,
            affiliated_to,
            w_status,
            profile_url
        ]
        master_rows.append(row_data)

        if all_emails_list:
            colleges_with_emails_rows.append(row_data)

    # ---------------- SHEET 1: Master List ----------------
    ws1 = wb.create_sheet(title="All Colleges & Emails")
    ws1.views.sheetView[0].showGridLines = True
    
    headers_ws1 = [
        "S.No", "College Name", "District / City", "Official Website",
        "Official Email (IndCareer)", "Dean / Principal / Director Emails",
        "HOD Emails", "Department Staff & Faculty Emails", "General / Office Emails",
        "All Emails Found (Combined)", "Total Emails Count", "Telephone / Phone",
        "Campus Address & PIN", "Affiliated University", "Website Status", "IndCareer Profile Link"
    ]
    
    ws1.append(headers_ws1)
    for col_idx in range(1, len(headers_ws1) + 1):
        cell = ws1.cell(row=1, column=col_idx)
        cell.fill = navy_fill
        cell.font = header_font
        cell.alignment = align_center

    for r_idx, r_data in enumerate(master_rows, 2):
        ws1.append(r_data)
        fill = zebra_fill if r_idx % 2 == 0 else white_fill
        has_emails = r_data[10] > 0
        for c_idx in range(1, len(r_data) + 1):
            cell = ws1.cell(row=r_idx, column=c_idx)
            cell.font = normal_font
            cell.border = cell_border
            cell.fill = accent_green_fill if (c_idx == 10 and has_emails) else fill
            if c_idx in [1, 11]:
                cell.alignment = align_center
            else:
                cell.alignment = align_left

    # Auto-adjust column widths
    col_widths = [6, 38, 18, 28, 25, 25, 22, 28, 25, 35, 12, 22, 35, 25, 20, 30]
    for i, w in enumerate(col_widths, 1):
        ws1.column_dimensions[get_column_letter(i)].width = w

    # ---------------- SHEET 2: Colleges with Emails ----------------
    ws2 = wb.create_sheet(title="Colleges with Direct Emails")
    ws2.views.sheetView[0].showGridLines = True
    ws2.append(headers_ws1)
    for col_idx in range(1, len(headers_ws1) + 1):
        cell = ws2.cell(row=1, column=col_idx)
        cell.fill = dark_blue_fill
        cell.font = header_font
        cell.alignment = align_center

    for r_idx, r_data in enumerate(colleges_with_emails_rows, 2):
        # Update S.No for this sheet
        row_copy = list(r_data)
        row_copy[0] = r_idx - 1
        ws2.append(row_copy)
        fill = zebra_fill if r_idx % 2 == 0 else white_fill
        for c_idx in range(1, len(row_copy) + 1):
            cell = ws2.cell(row=r_idx, column=c_idx)
            cell.font = normal_font
            cell.border = cell_border
            cell.fill = fill
            if c_idx in [1, 11]:
                cell.alignment = align_center
            else:
                cell.alignment = align_left

    for i, w in enumerate(col_widths, 1):
        ws2.column_dimensions[get_column_letter(i)].width = w

    # ---------------- SHEET 3: Staff & HOD Email Directory ----------------
    ws3 = wb.create_sheet(title="Staff & HOD Directory")
    ws3.views.sheetView[0].showGridLines = True
    headers_ws3 = ["S.No", "College Name", "District / City", "Category / Role", "Email Address", "Official Website", "Source Page URL"]
    ws3.append(headers_ws3)
    for col_idx in range(1, len(headers_ws3) + 1):
        cell = ws3.cell(row=1, column=col_idx)
        cell.fill = navy_fill
        cell.font = header_font
        cell.alignment = align_center

    for r_idx, s in enumerate(flat_staff_rows, 2):
        row_vals = [
            r_idx - 1,
            s['college_name'],
            s['location'],
            s['category'],
            s['email'],
            s['website'],
            s['source_url']
        ]
        ws3.append(row_vals)
        fill = zebra_fill if r_idx % 2 == 0 else white_fill
        for c_idx in range(1, len(row_vals) + 1):
            cell = ws3.cell(row=r_idx, column=c_idx)
            cell.font = normal_font
            cell.border = cell_border
            cell.fill = fill
            if c_idx in [1, 4]:
                cell.alignment = align_center
            else:
                cell.alignment = align_left

    widths_ws3 = [6, 38, 18, 25, 32, 28, 40]
    for i, w in enumerate(widths_ws3, 1):
        ws3.column_dimensions[get_column_letter(i)].width = w

    # ---------------- SHEET 4: Executive Summary ----------------
    ws4 = wb.create_sheet(title="Executive Summary")
    ws4.views.sheetView[0].showGridLines = True
    ws4.column_dimensions['A'].width = 6
    ws4.column_dimensions['B'].width = 38
    ws4.column_dimensions['C'].width = 24
    ws4.column_dimensions['D'].width = 35

    ws4['B2'] = "ODISHA COLLEGES COMPLETE EMAIL & CONTACT DIRECTORY"
    ws4['B2'].font = title_font
    ws4['B3'] = f"Generated on {time.strftime('%Y-%m-%d %H:%M:%S')} | Target: IndCareer Orissa Colleges"
    ws4['B3'].font = subtitle_font

    summary_metrics = [
        ("Total Colleges Listed on IndCareer (Orissa)", len(colleges_details), "All institutions scraped from 59 pagination pages"),
        ("Colleges with Official Website", total_websites_listed, f"{(total_websites_listed/len(colleges_details)*100):.1f}% of all listed colleges"),
        ("Colleges with Direct Email Addresses", total_colleges_with_any_email, f"{(total_colleges_with_any_email/len(colleges_details)*100):.1f}% coverage rate"),
        ("Total Unique Email Addresses Extracted", total_emails_found, "Combined across official portals & IndCareer"),
        ("Dean / Principal / Director Emails Identified", cat_counts['dean_principal'], "Leadership & administrative heads"),
        ("Head of Department (HOD) Emails", cat_counts['hod'], "Department leaders & academic chairs"),
        ("Department Staff & Faculty Emails", cat_counts['faculty'], "Teaching faculty, professors, lecturers"),
        ("General / Official / Admissions Emails", cat_counts['general'], "Registrar, admissions, info desks"),
        ("Individual Staff Directory Records", len(flat_staff_rows), "Full granular records in 'Staff & HOD Directory' sheet")
    ]

    ws4.cell(row=5, column=2, value="Metric Description").fill = navy_fill
    ws4.cell(row=5, column=2).font = header_font
    ws4.cell(row=5, column=3, value="Count / Value").fill = navy_fill
    ws4.cell(row=5, column=3).font = header_font
    ws4.cell(row=5, column=4, value="Notes & Scope").fill = navy_fill
    ws4.cell(row=5, column=4).font = header_font

    for idx, (metric, val, notes) in enumerate(summary_metrics, 6):
        c2 = ws4.cell(row=idx, column=2, value=metric)
        c3 = ws4.cell(row=idx, column=3, value=val)
        c4 = ws4.cell(row=idx, column=4, value=notes)
        fill = zebra_fill if idx % 2 == 0 else white_fill
        for c in [c2, c3, c4]:
            c.font = normal_font
            c.fill = fill
            c.border = cell_border
        c2.font = bold_font
        c3.alignment = align_center

    wb.save(OUTPUT_EXCEL)
    print(f"[STEP 4] Successfully saved Excel workbook to: {OUTPUT_EXCEL}")
    print(f"Summary: {len(colleges_details)} colleges, {total_websites_listed} websites, {total_emails_found} emails extracted!")

# -------------------------------------------------------------
# MAIN PIPELINE EXECUTION
# -------------------------------------------------------------
def run_pipeline():
    start_time = time.time()
    print("=" * 70)
    print("STARTING ODISHA COLLEGES EMAIL SCRAPING & HARVESTING PIPELINE")
    print("=" * 70)

    # 1. Listing
    colleges = get_all_colleges_list()

    # 2. Details
    colleges_details = get_all_colleges_details(colleges)

    # 3. Official Websites Crawling
    website_results = crawl_all_websites(colleges_details)

    # 4. Excel Generation
    build_excel_report(colleges_details, website_results)

    elapsed = time.time() - start_time
    print("=" * 70)
    print(f"PIPELINE COMPLETED SUCCESSFULLY IN {elapsed:.2f} SECONDS ({elapsed/60:.2f} MINUTES)!")
    print("=" * 70)

if __name__ == '__main__':
    run_pipeline()

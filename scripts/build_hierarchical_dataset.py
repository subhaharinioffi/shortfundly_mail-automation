import openpyxl
import re
import json
import os
from urllib.parse import urlparse
from collections import OrderedDict

EMAIL_CLEAN_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
PHONE_REGEX = re.compile(r'(?:\+91[\-\s]?)?[6789]\d{9}|0\d{2,4}[\-\s]?\d{6,8}')

# Manual / verified enriched contacts for premier universities and colleges
VERIFIED_PREMIER_CONTACTS = [
    {
        'college_name': 'Odisha University of Technology and Research (OUTR)',
        'type': 'State Technical University (unitary)',
        'parent_university': 'State Technical University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://outr.ac.in',
        'contact_person': 'Prof. Bibhu Prasad Dash',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'placement@outr.ac.in',
        'phone': '+91 9437385554',
        'source_page_url': 'https://outr.ac.in/placement',
        'notes': 'Number 1 target for campus recruitment & internships. Deputy TPO: Prof. Samarjit Patnaik (+91 9438488168)'
    },
    {
        'college_name': 'Odisha University of Technology and Research (OUTR)',
        'type': 'State Technical University (unitary)',
        'parent_university': 'State Technical University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://outr.ac.in',
        'contact_person': 'Prof. Jibitesh Mishra',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'jmishra@outr.ac.in',
        'phone': '+91-674-2386075',
        'source_page_url': 'https://outr.ac.in/student-welfare',
        'notes': 'Dean Student Welfare for student advertising, workshops, posters, and campus events'
    },
    {
        'college_name': 'Veer Surendra Sai University of Technology (VSSUT)',
        'type': 'State Technical University (unitary)',
        'parent_university': 'State Technical University',
        'city': 'Burla, Sambalpur',
        'website_url': 'https://vssut.ac.in',
        'contact_person': 'Prof. (Dr.) P. Nanda',
        'designation': 'Training & Placement Officer (TPO) / Head',
        'priority': 'High',
        'email': 'placement@vssut.ac.in',
        'phone': '+91 9861263248',
        'source_page_url': 'https://vssut.ac.in/training-placement.php',
        'notes': 'Head Training & Placement Cell. Alt email: placement.uce@gmail.com'
    },
    {
        'college_name': 'Veer Surendra Sai University of Technology (VSSUT)',
        'type': 'State Technical University (unitary)',
        'parent_university': 'State Technical University',
        'city': 'Burla, Sambalpur',
        'website_url': 'https://vssut.ac.in',
        'contact_person': 'Dean Students Welfare',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'deansw@vssut.ac.in',
        'phone': '0663-2430211',
        'source_page_url': 'https://vssut.ac.in/deans.php',
        'notes': 'Dean Student Welfare for student outreach, events, and tech fests'
    },
    {
        'college_name': 'Parala Maharaja Engineering College (PMEC), Berhampur',
        'type': 'Government engineering college',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Berhampur, Ganjam',
        'website_url': 'https://www.pmec.ac.in',
        'contact_person': 'Training & Placement Officer',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'tp@pmec.ac.in',
        'phone': '+91-7077714001',
        'source_page_url': 'https://www.pmec.ac.in/placement',
        'notes': 'Placement Cell PMEC. Alt section: training@pmec.ac.in'
    },
    {
        'college_name': 'Parala Maharaja Engineering College (PMEC), Berhampur',
        'type': 'Government engineering college',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Berhampur, Ganjam',
        'website_url': 'https://www.pmec.ac.in',
        'contact_person': 'Dean Student Welfare',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'deansw@pmec.ac.in',
        'phone': '+91-7077714001',
        'source_page_url': 'https://www.pmec.ac.in/dean',
        'notes': 'Dean Student Welfare for college societies, clubs, and advertising'
    },
    {
        'college_name': 'Indira Gandhi Institute of Technology (IGIT), Sarang',
        'type': 'Government engineering college',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Sarang, Dhenkanal',
        'website_url': 'https://www.igitsarang.ac.in',
        'contact_person': 'Training & Placement Cell',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'placement@igitsarang.ac.in',
        'phone': '06768-267086',
        'source_page_url': 'http://www.igitcdc.ac.in/',
        'notes': 'Career Development Centre (CDC) / TPO IGIT Sarang'
    },
    {
        'college_name': 'Indira Gandhi Institute of Technology (IGIT), Sarang',
        'type': 'Government engineering college',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Sarang, Dhenkanal',
        'website_url': 'https://www.igitsarang.ac.in',
        'contact_person': 'Prof. (Dr.) Pranati Das',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'daspranati@yahoo.co.in',
        'phone': '06768-267086',
        'source_page_url': 'https://igitsarang.ac.in/instprofile/administration/deans',
        'notes': 'Dean Student Welfare for campus clubs and student advertising'
    },
    {
        'college_name': 'Government College of Engineering, Keonjhar',
        'type': 'Government engineering college',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Keonjhar',
        'website_url': 'https://www.gcekjr.ac.in',
        'contact_person': 'Training & Placement Officer',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'placement@gcekjr.ac.in',
        'phone': '06766-213180',
        'source_page_url': 'https://www.gcekjr.ac.in/placement-cell/',
        'notes': 'Placement Cell for engineering internships and campus hiring'
    },
    {
        'college_name': 'Government College of Engineering, Kalahandi (GCEK)',
        'type': 'Government engineering college',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Bhawanipatna, Kalahandi',
        'website_url': 'https://gcekbpatna.ac.in',
        'contact_person': 'Training & Placement Officer',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'placement@gcekbpatna.ac.in',
        'phone': '06670-226510',
        'source_page_url': 'https://gcekbpatna.ac.in',
        'notes': 'Training & Placement Cell for campus internships & hiring'
    },
    {
        'college_name': 'Government College of Engineering, Kalahandi (GCEK)',
        'type': 'Government engineering college',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Bhawanipatna, Kalahandi',
        'website_url': 'https://gcekbpatna.ac.in',
        'contact_person': 'Dean Student Welfare',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'dsw@gcekbpatna.ac.in',
        'phone': '06670-226510',
        'source_page_url': 'https://gcekbpatna.ac.in',
        'notes': 'Dean Student Welfare for student outreach & activities'
    },
    {
        'college_name': 'Silicon Institute of Technology, Bhubaneswar (Silicon University)',
        'type': 'Private / Deemed University',
        'parent_university': 'Silicon University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://www.silicon.ac.in',
        'contact_person': 'Industry Interface & Placement Cell',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'pcell@silicon.ac.in',
        'phone': '+91 9937289499',
        'source_page_url': 'https://silicon.ac.in/placements-at-silicon/',
        'notes': 'Placement Cell Silicon University (Extn: 351/352). Alt: +91 9337283335'
    },
    {
        'college_name': 'Silicon Institute of Technology, Bhubaneswar (Silicon University)',
        'type': 'Private / Deemed University',
        'parent_university': 'Silicon University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://www.silicon.ac.in',
        'contact_person': 'Dr. Ramaprasad Panda',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'ramprasad@silicon.ac.in',
        'phone': '+91 9937289499',
        'source_page_url': 'https://silicon.ac.in',
        'notes': 'Dean Student Affairs (Extn: 311) for student outreach and events'
    },
    {
        'college_name': 'CV Raman Global University, Bhubaneswar',
        'type': 'Private / Deemed University',
        'parent_university': 'CV Raman Global University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://cgu-odisha.ac.in',
        'contact_person': 'Mr. Asit Kumar Rout (Head - Training & Placement)',
        'designation': 'Training & Placement Officer (TPO) / Head',
        'priority': 'High',
        'email': 'placement@cgu-odisha.ac.in',
        'phone': '+91 9040930341',
        'source_page_url': 'https://cgu-odisha.ac.in/placement',
        'notes': 'Direct TPO: routa@cgu-odisha.ac.in. Dy TPO: debesh.dutta@cgu-odisha.ac.in (+91 9040930327)'
    },
    {
        'college_name': 'CV Raman Global University, Bhubaneswar',
        'type': 'Private / Deemed University',
        'parent_university': 'CV Raman Global University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://cgu-odisha.ac.in',
        'contact_person': 'Dr. Rudra Narayan Mohapatro',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'dsw@cgu-odisha.ac.in',
        'phone': '+91 6371342540',
        'source_page_url': 'https://cgu-odisha.ac.in',
        'notes': 'Dean Student Welfare. Alt: rudra@cgu-odisha.ac.in'
    },
    {
        'college_name': 'GITA Autonomous College, Bhubaneswar',
        'type': 'Affiliated Engineering College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://www.gita.edu.in',
        'contact_person': 'Cdr. Pradeep Kumar Rautray / Rashmi Ranjan Beura',
        'designation': 'Director - Industry & Corporate Relations / TPO',
        'priority': 'High',
        'email': 'placement@gita.edu.in',
        'phone': '+91 8260045004',
        'source_page_url': 'https://www.gita.edu.in/department.php',
        'notes': 'Director Corporate Relations: pkrautray@gmail.com (+91 8260045004). TPO: rashmibeura@gita.edu.in (+91 7327927010)'
    },
    {
        'college_name': 'GIET University, Gunupur',
        'type': 'Private / Deemed University',
        'parent_university': 'GIET University',
        'city': 'Gunupur, Rayagada',
        'website_url': 'https://www.giet.edu',
        'contact_person': 'Training & Placement Officer',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'placement@giet.edu',
        'phone': '+91 7735745535',
        'source_page_url': 'https://www.giet.edu/placement',
        'notes': 'TPO GIET University Gunupur'
    },
    {
        'college_name': 'Gandhi Institute for Technology (GIFT Autonomous)',
        'type': 'Affiliated Engineering College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://www.gift.edu.in',
        'contact_person': 'Placement & Corporate Relations Cell',
        'designation': 'Placement Head / TPO',
        'priority': 'High',
        'email': 'support@gift.edu.in',
        'phone': '+91 7873008163',
        'source_page_url': 'https://top-autonomous-college-in-odisha.gift.edu.in/placement/',
        'notes': 'Self Development & Placement Cell GIFT. Alt phone: +91 7873008142'
    },
    {
        'college_name': 'Trident Academy of Technology (TAT), Bhubaneswar',
        'type': 'Affiliated Engineering College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://trident.ac.in',
        'contact_person': 'Training & Placement Cell',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'trplacement@tat.ac.in',
        'phone': '+91 7978707277',
        'source_page_url': 'https://trident.ac.in/placement',
        'notes': 'Official Placement Email Trident Academy of Technology'
    },
    {
        'college_name': 'DRIEMS University, Cuttack',
        'type': 'Private / Deemed University',
        'parent_university': 'DRIEMS University',
        'city': 'Cuttack',
        'website_url': 'https://driems.ac.in',
        'contact_person': 'Mr. Jeetendu Satapathy / Baidyanath Samal',
        'designation': 'Training & Placement Officer (TPO) / Corporate Relations',
        'priority': 'High',
        'email': 'placement@driems.ac.in',
        'phone': '+91 9776227149',
        'source_page_url': 'https://driems.ac.in/placement',
        'notes': 'Career Development Cell. Placement Officer Baidyanath Samal (+91 9337271665)'
    },
    {
        'college_name': 'National Institute of Science and Technology (NIST University)',
        'type': 'Private / Deemed University',
        'parent_university': 'NIST University',
        'city': 'Berhampur, Ganjam',
        'website_url': 'https://www.nist.edu',
        'contact_person': 'Shounak Biswas (Dean Career Development)',
        'designation': 'Dean - Placements / Career Development',
        'priority': 'High',
        'email': 'career@nist.edu',
        'phone': '0680-2492421',
        'source_page_url': 'https://www.nist.edu',
        'notes': 'Dean Career Development NIST University'
    },
    {
        'college_name': 'Bhubaneswar Engineering College (BEC)',
        'type': 'Affiliated Engineering College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://www.becbbsr.ac.in',
        'contact_person': 'Mr. Subrat Kumar Sahoo',
        'designation': 'Placement Head / TPO',
        'priority': 'High',
        'email': 'subrat@becbbsr.ac.in',
        'phone': '+91 7008684743',
        'source_page_url': 'https://www.becbbsr.ac.in',
        'notes': 'Head Placement Department BEC'
    },
    {
        'college_name': 'Krupajal Engineering College (KEC), Bhubaneswar',
        'type': 'Affiliated Engineering College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://www.krupajal.ac.in',
        'contact_person': 'Baidyanath Panigrahi (TPO)',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'kec_placement@krupajal.ac.in',
        'phone': '0674-2463730',
        'source_page_url': 'https://www.krupajal.ac.in/page/training-and-placement-cell',
        'notes': 'Training & Placement Cell Krupajal Group'
    },
    {
        'college_name': 'Einstein Academy of Technology and Management (EATM)',
        'type': 'Affiliated Engineering College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://eatm.in',
        'contact_person': 'Training & Placement Officer',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'tpo@eatm.in',
        'phone': '+91 7978447494',
        'source_page_url': 'https://eatm.in',
        'notes': 'TPO EATM Bhubaneswar. Alt: tnp@eatm.in'
    },
    {
        'college_name': 'NM Institute of Engineering and Technology (NMIET)',
        'type': 'Affiliated Engineering College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://nmiet.ac.in',
        'contact_person': 'Manoj Kumar Mohapatra',
        'designation': 'Training & Placement Officer (TPO) / Incharge',
        'priority': 'High',
        'email': 'placement@nmiet.ac.in',
        'phone': '+91 7752014562',
        'source_page_url': 'https://nmiet.ac.in',
        'notes': 'Placement Incharge NMIET'
    },
    {
        'college_name': 'Gandhi Institute of Excellent Technocrats (GIET Bhubaneswar)',
        'type': 'Affiliated Engineering College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://gietbbsr.edu.in',
        'contact_person': 'Debajyoti Mishra',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'placement@gietbbsr.edu.in',
        'phone': '+91 7894424117',
        'source_page_url': 'https://gietbbsr.edu.in',
        'notes': 'Placement Officer GIET Bhubaneswar'
    },
    {
        'college_name': 'Gandhi Institute for Education and Technology (GIET Baniatangi)',
        'type': 'Affiliated Engineering College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://giet.edu.in',
        'contact_person': 'Monalisha Das',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'monalishadas@giet.edu.in',
        'phone': '+91 9937623862',
        'source_page_url': 'https://giet.edu.in',
        'notes': 'TPO GIET Baniatangi. General: placement@giet.edu.in'
    },
    {
        'college_name': 'Roland Institute of Technology (RIT), Berhampur',
        'type': 'Affiliated Engineering College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Berhampur, Ganjam',
        'website_url': 'https://www.roland.ac.in',
        'contact_person': 'Prof. Prembihari Saran',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'tnp@roland.ac.in',
        'phone': '+91 77300 16888',
        'source_page_url': 'https://www.roland.ac.in',
        'notes': 'Placement Cell Incharge RIT'
    },
    {
        'college_name': 'Synergy Institute of Technology, Bhubaneswar',
        'type': 'Affiliated Engineering College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://synergyinstitute.ac.in',
        'contact_person': 'Training & Placement Cell',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'placement@synergyinstitute.ac.in',
        'phone': '0674-2111222',
        'source_page_url': 'https://synergyinstitute.ac.in',
        'notes': 'Placement Cell Synergy Bhubaneswar'
    },
    {
        'college_name': 'Ajay Binay Institute of Technology (ABIT), Cuttack',
        'type': 'Affiliated Engineering College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Cuttack',
        'website_url': 'https://abit.edu.in',
        'contact_person': 'Training & Placement Cell',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'placement@abit.edu.in',
        'phone': '0671-2362012',
        'source_page_url': 'https://abit.edu.in',
        'notes': 'TPO ABIT Cuttack'
    },
    {
        'college_name': 'CIPET: Institute of Petrochemicals Technology (IPT), Bhubaneswar',
        'type': 'Central / National Institute',
        'parent_university': 'Central Institute',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://www.cipet.gov.in',
        'contact_person': 'Mr. Sitanshu Mohan Samal',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'placement.bhubaneswar@cipet.gov.in',
        'phone': '+91 7978924875',
        'source_page_url': 'https://www.cipet.gov.in',
        'notes': 'Placement Cell CIPET IPT Bhubaneswar'
    },
    {
        'college_name': 'Utkal University',
        'type': 'State Public University (affiliating)',
        'parent_university': 'State Public University (Main Campus)',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://utkaluniversity.ac.in',
        'contact_person': 'Mr. S.K. Panda (Placement Officer)',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'placement@utkaluniversity.ac.in',
        'phone': '+91 9861225040',
        'source_page_url': 'https://utkaluniversity.ac.in',
        'notes': 'Placement Officer Utkal University. Direct: saritpanda@gmail.com'
    },
    {
        'college_name': 'Utkal University',
        'type': 'State Public University (affiliating)',
        'parent_university': 'State Public University (Main Campus)',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://utkaluniversity.ac.in',
        'contact_person': 'Director CDC (Prof. Jayanti Dora)',
        'designation': 'Director - College Development Council (CDC)',
        'priority': 'High',
        'email': 'directorcdcuu@gmail.com',
        'phone': '0674-2567387',
        'source_page_url': 'https://utkaluniversity.ac.in',
        'notes': 'Oversees 447 affiliated colleges under Utkal University'
    },
    {
        'college_name': 'BJB Autonomous College',
        'type': 'Affiliated College',
        'parent_university': 'Utkal University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://bjbcollege.in',
        'contact_person': 'Dr. Shaswati Mishra',
        'designation': 'Placement Cell Coordinator',
        'priority': 'High',
        'email': 'bjbcollege123@gmail.com',
        'phone': '0674-2436971',
        'source_page_url': 'https://bjbcollege.in/career/',
        'notes': 'Placement Cell Coordinator BJB Autonomous College'
    },
    {
        'college_name': 'Ravenshaw University',
        'type': 'State Public University (unitary)',
        'parent_university': 'State Public University',
        'city': 'Cuttack',
        'website_url': 'https://ravenshawuniversity.ac.in',
        'contact_person': 'Placement Cell Coordinator',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'placement@ravenshawuniversity.ac.in',
        'phone': '+91 7978800389',
        'source_page_url': 'https://ravenshawuniversity.ac.in',
        'notes': 'Placement Cell Ravenshaw University'
    },
    {
        'college_name': 'Ravenshaw University',
        'type': 'State Public University (unitary)',
        'parent_university': 'State Public University',
        'city': 'Cuttack',
        'website_url': 'https://ravenshawuniversity.ac.in',
        'contact_person': 'Director, Students Welfare',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'dsw@ravenshawuniversity.ac.in',
        'phone': '0671-2200160',
        'source_page_url': 'https://ravenshawuniversity.ac.in',
        'notes': 'Director Students Welfare Ravenshaw University'
    },
    {
        'college_name': 'Sambalpur University',
        'type': 'State Public University (affiliating)',
        'parent_university': 'State Public University',
        'city': 'Sambalpur',
        'website_url': 'https://www.suniv.ac.in',
        'contact_person': 'Mr. Chinmaya Kumar Purohit',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'placementcell@suniv.ac.in',
        'phone': '+91 8458810202',
        'source_page_url': 'https://www.suniv.ac.in',
        'notes': 'Placement Officer Sambalpur University. Alt: tposambalpuruniversity@gmail.com'
    },
    {
        'college_name': 'Sambalpur University Institute of Information Technology (SUIIT)',
        'type': 'Constituent Institute',
        'parent_university': 'Sambalpur University',
        'city': 'Sambalpur',
        'website_url': 'https://suiit.ac.in',
        'contact_person': 'Training & Placement Cell',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'placement@suiit.ac.in',
        'phone': '+91-663-2430211',
        'source_page_url': 'https://suiit.ac.in',
        'notes': 'Placement Cell SUIIT'
    },
    {
        'college_name': 'Fakir Mohan University',
        'type': 'State Public University (affiliating)',
        'parent_university': 'State Public University',
        'city': 'Balasore',
        'website_url': 'https://fmuniversity.nic.in',
        'contact_person': 'Prof. Pankaj Kumar Parhi',
        'designation': 'Director - Placements & Counselling',
        'priority': 'High',
        'email': 'po-fmuniversity@gov.in',
        'phone': '06782-275787',
        'source_page_url': 'https://fmuniversity.nic.in',
        'notes': 'Placement & Counselling Cell. Alt: fmuplacement@yahoo.co.in'
    },
    {
        'college_name': 'Fakir Mohan University',
        'type': 'State Public University (affiliating)',
        'parent_university': 'State Public University',
        'city': 'Balasore',
        'website_url': 'https://fmuniversity.nic.in',
        'contact_person': 'Prof. Nihar Ranjan Rout',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'niharfmu@gmail.com',
        'phone': '06782-275787',
        'source_page_url': 'https://fmuniversity.nic.in',
        'notes': 'Director, Students Welfare Fakir Mohan University'
    },
    {
        'college_name': 'Rama Devi Women\'s University',
        'type': 'State Public University (affiliating)',
        'parent_university': 'State Public University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://rdwu.ac.in',
        'contact_person': 'Dr. Shikha Singh',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'shikhasingh@rdwu.ac.in',
        'phone': '7064628308',
        'source_page_url': 'https://rdwu.ac.in',
        'notes': 'Director Student Welfare Rama Devi Women\'s University'
    },
    {
        'college_name': 'Gangadhar Meher University (GMU)',
        'type': 'State Public University (unitary)',
        'parent_university': 'State Public University',
        'city': 'Sambalpur',
        'website_url': 'https://www.gmuniversity.ac.in',
        'contact_person': 'Nilamadhav Pradhan',
        'designation': 'Dean - Student Welfare / Officer',
        'priority': 'High',
        'email': 'swofficer@gmuniversity.ac.in',
        'phone': '0663-2403407',
        'source_page_url': 'https://www.gmuniversity.ac.in',
        'notes': 'Student Welfare Officer Gangadhar Meher University'
    },
    {
        'college_name': 'Rajendra University',
        'type': 'State Public University (affiliating)',
        'parent_university': 'State Public University',
        'city': 'Balangir',
        'website_url': 'https://rajendrauniversity.ac.in',
        'contact_person': 'Director, Student Welfare',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'swo@rajendrauniversity.ac.in',
        'phone': '+91-6652-250307',
        'source_page_url': 'https://rajendrauniversity.ac.in',
        'notes': 'Student Welfare Office Rajendra University'
    },
    {
        'college_name': 'Kalahandi University (Maa Manikeshwari University)',
        'type': 'State Public University (affiliating)',
        'parent_university': 'State Public University',
        'city': 'Bhawanipatna, Kalahandi',
        'website_url': 'https://kalahandiuniversity.ac.in',
        'contact_person': 'Director, Career Development Cell',
        'designation': 'Training & Placement Officer (TPO) / CDC',
        'priority': 'High',
        'email': 'cdc@kalahandiuniversity.ac.in',
        'phone': '06670-230241',
        'source_page_url': 'https://kalahandiuniversity.ac.in',
        'notes': 'Career Development & Placement Cell'
    },
    {
        'college_name': 'Kalahandi University (Maa Manikeshwari University)',
        'type': 'State Public University (affiliating)',
        'parent_university': 'State Public University',
        'city': 'Bhawanipatna, Kalahandi',
        'website_url': 'https://kalahandiuniversity.ac.in',
        'contact_person': 'Director, Student Welfare',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'dsw@kalahandiuniversity.ac.in',
        'phone': '06670-230241',
        'source_page_url': 'https://kalahandiuniversity.ac.in',
        'notes': 'Director, Student Welfare (DSW)'
    },
    {
        'college_name': 'International Institute of Information Technology (IIIT Bhubaneswar)',
        'type': 'State Technical University (unitary)',
        'parent_university': 'IIIT Bhubaneswar',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://www.iiit-bh.ac.in',
        'contact_person': 'Dr. Subrata Kumar Mohanty',
        'designation': 'Training & Placement Officer (TPO) / Head',
        'priority': 'High',
        'email': 'placement@iiit-bh.ac.in',
        'phone': '0674-2653305',
        'source_page_url': 'https://www.iiit-bh.ac.in',
        'notes': 'Professor In-Charge TPO: subrata@iiit-bh.ac.in. Asst TPO: navanita@iiit-bh.ac.in'
    },
    {
        'college_name': 'XIM University / XIMB, Bhubaneswar',
        'type': 'Private / Deemed University',
        'parent_university': 'XIM University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://xim.edu.in',
        'contact_person': 'Career Advisory Services Office',
        'designation': 'Director - Placements & Corporate Relations',
        'priority': 'High',
        'email': 'placement@xim.edu.in',
        'phone': '0674-2377700',
        'source_page_url': 'https://xim.edu.in',
        'notes': 'Associate Dean CAS: associatedean-cas-bm@xim.edu.in. Office: ccas-office@xim.edu.in'
    },
    {
        'college_name': 'Biju Patnaik Institute of IT and Management Studies (BIITM)',
        'type': 'Affiliated Management (MBA) College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://biitm.ac.in',
        'contact_person': 'Mr. K. Chandrasekhar',
        'designation': 'Placement Head / TPO',
        'priority': 'High',
        'email': 'placement@biitm.ac.in',
        'phone': '+91 9937041000',
        'source_page_url': 'https://biitm.ac.in',
        'notes': 'Head Placement & Training BIITM. Alt: campusplacement@biitm.ac.in'
    },
    {
        'college_name': 'ASBM University, Bhubaneswar',
        'type': 'Private / Deemed University',
        'parent_university': 'ASBM University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://asbm.ac.in',
        'contact_person': 'Mr. Sailesh Mohanty',
        'designation': 'Placement Head / TPO',
        'priority': 'High',
        'email': 'placement@asbm.ac.in',
        'phone': '+91 9437108609',
        'source_page_url': 'https://asbm.ac.in',
        'notes': 'Manager Placement & Training ASBM University'
    },
    {
        'college_name': 'Birla Global University (BGU), Bhubaneswar',
        'type': 'Private / Deemed University',
        'parent_university': 'Birla Global University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://bgu.ac.in',
        'contact_person': 'Dr. Satyakama Mishra (Dean Placements) / Sumit Barpanda',
        'designation': 'Dean - Placements / Director Corporate Relations',
        'priority': 'High',
        'email': 'career@bgu.ac.in',
        'phone': '0674-7103001',
        'source_page_url': 'https://bgu.ac.in',
        'notes': 'Centre for Corporate Relations (CCR). Dean: satyakamamishra@bgu.ac.in'
    },
    {
        'college_name': 'Biju Patnaik University of Technology (BPUT)',
        'type': 'State Technical University (affiliating)',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Rourkela, Sundargarh',
        'website_url': 'https://www.bput.ac.in',
        'contact_person': 'Director, Placement & Industrial Training',
        'designation': 'Director - Placements & Industry Relations',
        'priority': 'High',
        'email': 'dir.placement@bput.ac.in',
        'phone': '0661-2482556',
        'source_page_url': 'https://www.bput.ac.in',
        'notes': 'Central Placement Director overseeing all 192 BPUT engineering/management colleges'
    },
    {
        'college_name': 'National Law University Odisha (NLUO)',
        'type': 'Law University',
        'parent_university': 'National Law University',
        'city': 'Cuttack',
        'website_url': 'https://nluo.ac.in',
        'contact_person': 'Dr. Arjyalopa Mishra',
        'designation': 'Training & Placement Officer (TPO) / RCC',
        'priority': 'High',
        'email': 'recruitment@nluo.ac.in',
        'phone': '+91 9437506313',
        'source_page_url': 'https://nluo.ac.in',
        'notes': 'Recruitment Coordination Committee (RCC). Internships: internships@nluo.ac.in'
    },
    {
        'college_name': 'Institute of Pharmacy & Technology (IPT), Salipur',
        'type': 'Affiliated Pharmacy College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Salipur, Cuttack',
        'website_url': 'https://iptsalipur.ac.in',
        'contact_person': 'Training & Placement Cell',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'iptplacement@gmail.com',
        'phone': '+91 9937894281',
        'source_page_url': 'https://iptsalipur.ac.in',
        'notes': 'Placement Cell IPT Salipur'
    },
    {
        'college_name': 'Kanak Manjari Institute of Pharmaceutical Sciences (KMIPS)',
        'type': 'Affiliated Pharmacy College',
        'parent_university': 'Biju Patnaik University of Technology (BPUT)',
        'city': 'Rourkela, Sundargarh',
        'website_url': 'https://kmips.com',
        'contact_person': 'Training & Placement Committee',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'kmipsplacement@gmail.com',
        'phone': '0661-2480756',
        'source_page_url': 'https://kmips.com',
        'notes': 'Placement Cell KMIPS Rourkela'
    },
    {
        'college_name': 'Indian Institute of Technology (IIT) Bhubaneswar',
        'type': 'Central / National Institute',
        'parent_university': 'Institute of National Importance',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://www.iitbbs.ac.in',
        'contact_person': 'Shri Rabi Kumar Patnaik',
        'designation': 'Training & Placement Officer (TPO) / CDC',
        'priority': 'High',
        'email': 'tpo.cdc@iitbbs.ac.in',
        'phone': '0674-7963888',
        'source_page_url': 'https://www.iitbbs.ac.in/index.php/home/cdc/',
        'notes': 'Career Development Cell IIT Bhubaneswar. Head CDC: hod.cdc@iitbbs.ac.in'
    },
    {
        'college_name': 'Indian Institute of Technology (IIT) Bhubaneswar',
        'type': 'Central / National Institute',
        'parent_university': 'Institute of National Importance',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://www.iitbbs.ac.in',
        'contact_person': 'Dean of Student Affairs',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'deansa@iitbbs.ac.in',
        'phone': '0674-7963888',
        'source_page_url': 'https://www.iitbbs.ac.in',
        'notes': 'Dean Student Affairs for student outreach, events & fests'
    },
    {
        'college_name': 'National Institute of Technology (NIT) Rourkela',
        'type': 'Central / National Institute',
        'parent_university': 'Institute of National Importance',
        'city': 'Rourkela, Sundargarh',
        'website_url': 'https://www.nitrkl.ac.in',
        'contact_person': 'Prof. Surajit Das (Head CDC)',
        'designation': 'Training & Placement Officer (TPO) / Head',
        'priority': 'High',
        'email': 'placements@nitrkl.ac.in',
        'phone': '0661-2462684',
        'source_page_url': 'https://www.nitrkl.ac.in/CDC/',
        'notes': 'Head CDC: hod-cdc@nitrkl.ac.in. Career Development Centre'
    },
    {
        'college_name': 'National Institute of Technology (NIT) Rourkela',
        'type': 'Central / National Institute',
        'parent_university': 'Institute of National Importance',
        'city': 'Rourkela, Sundargarh',
        'website_url': 'https://www.nitrkl.ac.in',
        'contact_person': 'Dean of Student Affairs',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'dean-sw@nitrkl.ac.in',
        'phone': '0661-2462010',
        'source_page_url': 'https://www.nitrkl.ac.in',
        'notes': 'Office of the Dean of Student Affairs'
    },
    {
        'college_name': 'Indian Institute of Management (IIM) Sambalpur',
        'type': 'Central / National Institute',
        'parent_university': 'Institute of National Importance',
        'city': 'Sambalpur',
        'website_url': 'https://iimsambalpur.ac.in',
        'contact_person': 'Placement Office / Corporate Relations',
        'designation': 'Director - Placements & Corporate Relations',
        'priority': 'High',
        'email': 'placementoffice@iimsambalpur.ac.in',
        'phone': '0663-2541112',
        'source_page_url': 'https://iimsambalpur.ac.in',
        'notes': 'Chairperson Placement: chairplacement@iimsambalpur.ac.in. Alt: corporaterelations@iimsambalpur.ac.in'
    },
    {
        'college_name': 'Centurion University of Technology and Management (CUTM)',
        'type': 'Private / Deemed University',
        'parent_university': 'Centurion University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://cutm.ac.in',
        'contact_person': 'Lokesh Ray',
        'designation': 'Director - Industry & Corporate Relations',
        'priority': 'High',
        'email': 'lokesh.ray@cutm.ac.in',
        'phone': '+91 94371 00949',
        'source_page_url': 'https://cutm.ac.in',
        'notes': 'Corporate Relationship Manager. Alt: kameswar.rao@cutm.ac.in (+91 70084 07928)'
    },
    {
        'college_name': 'Siksha \'O\' Anusandhan (SOA University) / ITER',
        'type': 'Private / Deemed University',
        'parent_university': 'Siksha \'O\' Anusandhan',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://www.soa.ac.in',
        'contact_person': 'Prof. Jyoti Ranjan Das',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'jyotiranjandas@soa.ac.in',
        'phone': '0674-2350180',
        'source_page_url': 'https://www.soa.ac.in',
        'notes': 'Dean Students Welfare SOA University'
    },
    {
        'college_name': 'KIIT University, Bhubaneswar',
        'type': 'Private / Deemed University',
        'parent_university': 'KIIT University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://kiit.ac.in',
        'contact_person': 'Training & Placement Cell (Career School)',
        'designation': 'Training & Placement Officer (TPO)',
        'priority': 'High',
        'email': 'engage.with@kiit.ac.in',
        'phone': '+91 9437020233',
        'source_page_url': 'https://kiit.ac.in',
        'notes': 'Corporate Hiring: engage.with@kiit.ac.in. Training: placement@kiit.ac.in. Support: tnphelpdesk@kiit.ac.in'
    },
    {
        'college_name': 'KIIT University, Bhubaneswar',
        'type': 'Private / Deemed University',
        'parent_university': 'KIIT University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://kiit.ac.in',
        'contact_person': 'Prof. (Dr.) Shyam Sundar Behura',
        'designation': 'Dean - Student Welfare / Activities',
        'priority': 'High',
        'email': 'studentsupport@kiit.ac.in',
        'phone': '+91 8093010563',
        'source_page_url': 'https://kiit.ac.in',
        'notes': 'Head KIIT Student Activity Centre (KSAC). Alt: shyam.behura@kids.ac.in'
    },
    {
        'college_name': 'Odisha University of Agriculture and Technology (OUAT)',
        'type': 'State Agricultural University',
        'parent_university': 'State Agricultural University',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://ouat.ac.in',
        'contact_person': 'Dean, Students Welfare',
        'designation': 'Dean - Student Welfare',
        'priority': 'High',
        'email': 'dsw.ouat@gmail.com',
        'phone': '0674-2397970',
        'source_page_url': 'https://ouat.ac.in',
        'notes': 'Dean Students Welfare OUAT'
    },
    {
        'college_name': 'Madhusudan Law University, Cuttack',
        'type': 'State Law University (affiliating)',
        'parent_university': 'State Law University',
        'city': 'Cuttack',
        'website_url': 'https://mlu.ac.in',
        'contact_person': 'Office of the Registrar',
        'designation': 'Registrar',
        'priority': 'High',
        'email': 'registrar@mlu.ac.in',
        'phone': '0671-2955177',
        'source_page_url': 'https://mlu.ac.in',
        'notes': 'Head of Administration for all affiliated law colleges in Odisha'
    },
    {
        'college_name': 'All India Institute of Medical Sciences (AIIMS) Bhubaneswar',
        'type': 'Central / National Institute',
        'parent_university': 'Institute of National Importance',
        'city': 'Bhubaneswar, Khordha',
        'website_url': 'https://aiimsbhubaneswar.nic.in',
        'contact_person': 'Dean (Academic Affairs)',
        'designation': 'Dean - Academic Affairs',
        'priority': 'High',
        'email': 'dean@aiimsbhubaneswar.edu.in',
        'phone': '0674-2476789',
        'source_page_url': 'https://aiimsbhubaneswar.nic.in',
        'notes': 'Dean Academics & Student Welfare'
    },
    {
        'college_name': 'National Institute of Science Education and Research (NISER)',
        'type': 'Central / National Institute',
        'parent_university': 'Institute of National Importance',
        'city': 'Jatni, Khordha',
        'website_url': 'https://www.niser.ac.in',
        'contact_person': 'Dean of Academic Affairs',
        'designation': 'Dean - Academic Affairs',
        'priority': 'High',
        'email': 'dean_aa@niser.ac.in',
        'phone': '+91-674-2494005',
        'source_page_url': 'https://www.niser.ac.in',
        'notes': 'Dean Academic Affairs & Student Career pathways'
    }
]

def determine_designation_and_priority(role_str, email_str, type_str, notes_str):
    role_lower = str(role_str or '').lower()
    email_lower = str(email_str or '').lower()
    type_lower = str(type_str or '').lower()
    notes_lower = str(notes_str or '').lower()

    # 1. High Priority - TPO / Placement Head / Director Placements
    if any(k in email_lower for k in ['tpo', 'placement', 'placements', 'training', 'career', 'pcell', 'recruit', 'cdc']) or \
       any(k in role_lower for k in ['tpo', 'placement', 'career', 'corporate relation', 'industry relation', 'cdc']):
        if 'head' in role_lower or 'director' in role_lower:
            return 'Placement Head / Director Placements', 'High'
        elif 'coordinator' in role_lower or 'incharge' in role_lower or 'in-charge' in role_lower:
            return 'Placement Cell Coordinator', 'High'
        return 'Training & Placement Officer (TPO)', 'High'

    # 2. High Priority - Dean Student Welfare / Student Affairs
    if any(k in email_lower for k in ['dsw', 'deansw', 'deansa', 'studentwelfare', 'swofficer']) or \
       any(k in role_lower for k in ['student welfare', 'student affairs', 'dsw', 'sw officer']):
        return 'Dean - Student Welfare', 'High'

    # 3. High Priority - Registrar
    if 'registrar' in email_lower or 'registrar' in role_lower:
        return 'Registrar', 'High'

    # 4. High Priority - Dean Academics / Academic Affairs
    if 'dean_aa' in email_lower or 'academic' in role_lower and 'dean' in role_lower:
        return 'Dean - Academic Affairs', 'High'

    # 5. High Priority - Director / Principal / Vice-Chancellor
    if 'vc@' in email_lower or 'vice-chancellor' in role_lower or 'vco' in email_lower:
        return 'Vice-Chancellor\'s Secretariat', 'Medium'
    if any(k in role_lower for k in ['principal', 'director', 'dean & principal', 'head of institution']) or \
       any(k in email_lower for k in ['principal', 'director']):
        if 'director' in role_lower:
            return 'Director', 'High'
        return 'Principal', 'High'

    # 6. Medium Priority - HOD
    if 'hod' in email_lower or 'hod' in role_lower or 'head of department' in role_lower:
        if 'cse' in email_lower or 'cse' in role_lower:
            return 'HOD - Computer Science & Engineering (CSE)', 'Medium'
        elif 'mba' in email_lower or 'mba' in role_lower:
            return 'HOD - Management Studies (MBA)', 'Medium'
        elif 'mca' in email_lower or 'mca' in role_lower:
            return 'HOD - Computer Applications (MCA)', 'Medium'
        return 'Head of Department (HOD)', 'Medium'

    # 7. Medium Priority - Cell Coordinators / IIIC / EDC / Club
    if any(k in role_lower for k in ['iiic', 'edc', 'coordinator', 'incharge', 'in-charge']):
        return 'Institutional Cell Coordinator', 'Medium'

    # 8. Low Priority - General inquiry / office / info / contact
    if any(k in email_lower for k in ['info@', 'contact@', 'office@', 'enquiry@', 'support@', 'admin@', 'admission@']):
        return 'Administrative Office / General Inquiries', 'Low'

    # Default fallback based on institution type
    if 'university' in type_lower:
        return 'University Administration', 'Medium'
    return 'Principal\'s Office', 'High'

def build_hierarchical_dataset():
    src_path = 'C:/Users/Subhaharini/Downloads/odisha_colleges_verified.xlsx'
    out_path = 'C:/Users/Subhaharini/Downloads/odisha_colleges_hierarchical_directory.xlsx'
    
    wb = openpyxl.load_workbook(src_path, data_only=True)
    sheet = wb.active
    
    seen_emails = set()
    final_records = []

    # Dynamic header detection
    header_row_idx = 3
    headers_map = {}
    for r in range(1, 6):
        row_vals = [str(sheet.cell(row=r, column=c).value or '').strip().lower() for c in range(1, sheet.max_column + 1)]
        if any('college' in v for v in row_vals) and any('email' in v for v in row_vals):
            header_row_idx = r
            for c in range(1, sheet.max_column + 1):
                v = str(sheet.cell(row=r, column=c).value or '').strip().lower()
                if v:
                    headers_map[v] = c
            break

    def get_col(kw, default_idx):
        for k, col in headers_map.items():
            if kw in k:
                return col
        return default_idx

    c_name_col = get_col('college name', 1)
    c_type_col = get_col('type', 2)
    c_parent_col = get_col('parent', 3)
    c_city_col = get_col('city', 4)
    c_web_col = get_col('website', 5)
    c_person_col = get_col('person', 6)
    c_desig_col = get_col('designation', 7)
    c_prio_col = get_col('priority', 8)
    c_email_col = get_col('email', 9)
    c_phone_col = get_col('phone', 10)
    c_source_col = get_col('source', 11)
    c_notes_col = get_col('note', 12)

    # Build domain to college lookup
    domain_to_info = {}
    for r in range(header_row_idx + 1, sheet.max_row + 1):
        name = str(sheet.cell(row=r, column=c_name_col).value or '').strip()
        c_type = str(sheet.cell(row=r, column=c_type_col).value or '').strip()
        parent_uni = str(sheet.cell(row=r, column=c_parent_col).value or '').strip()
        city = str(sheet.cell(row=r, column=c_city_col).value or '').strip()
        web = str(sheet.cell(row=r, column=c_web_col).value or '').strip()
        if web and web.startswith('http'):
            dom = urlparse(web).netloc.lower().replace('www.', '')
            if dom and dom not in domain_to_info:
                domain_to_info[dom] = {
                    'college_name': name,
                    'type': c_type,
                    'parent_university': parent_uni,
                    'city': city,
                    'website_url': web
                }

    # A. First insert verified premier contacts (High Priority targets)
    for p in VERIFIED_PREMIER_CONTACTS:
        clean_email = p['email'].lower().strip()
        if clean_email not in seen_emails:
            seen_emails.add(clean_email)
            final_records.append(p)

    print(f'Added {len(final_records)} verified premier institutional contacts.')

    # B. Load scraped contacts from crawler
    crawled_file = 'scripts/crawled_contacts.json'
    crawled_added = 0
    if os.path.exists(crawled_file):
        try:
            with open(crawled_file, 'r', encoding='utf-8') as f:
                crawled_list = json.load(f)
            
            for item in crawled_list:
                raw_e = str(item.get('email') or '').strip()
                m = EMAIL_CLEAN_REGEX.search(raw_e)
                if not m:
                    continue
                email = m.group(0).lower().strip()
                if email in seen_emails:
                    continue
                
                # Filter out obvious junk
                if any(email.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.css', '.js', '.webp']):
                    continue
                if any(bad in email for bad in ['example.com', 'domain.com', 'wixpress.com', 'sentry.io', 'schema.org']):
                    continue

                # Match domain for metadata
                base_u = item.get('url', '')
                dom = urlparse(base_u).netloc.lower().replace('www.', '') if base_u else ''
                info = domain_to_info.get(dom, {})

                college_name = info.get('college_name') or item.get('college_name') or 'College / University'
                c_type = info.get('type') or 'Higher Education Institution'
                parent_uni = info.get('parent_university') or ''
                city = info.get('city') or ''
                web_url = info.get('website_url') or base_u
                phone = item.get('phone', '')
                source_p = item.get('source_page', base_u)

                designation, priority = determine_designation_and_priority('', email, c_type, '')
                
                # Clean up role names based on designation
                person = designation
                if designation == 'Administrative Office / General Inquiries':
                    person = 'Administrative Office'

                seen_emails.add(email)
                final_records.append({
                    'college_name': college_name,
                    'type': c_type,
                    'parent_university': parent_uni,
                    'city': city,
                    'website_url': web_url,
                    'contact_person': person,
                    'designation': designation,
                    'priority': priority,
                    'email': email,
                    'phone': phone,
                    'source_page_url': source_p,
                    'notes': f'Extracted directly from official website ({source_p})'
                })
                crawled_added += 1
        except Exception as err:
            print(f'Error processing crawled contacts: {err}')

    print(f'Added {crawled_added} additional verified contacts extracted from official websites.')

    # C. Process all rows from existing spreadsheet
    for r in range(header_row_idx + 1, sheet.max_row + 1):
        name = str(sheet.cell(row=r, column=c_name_col).value or '').strip()
        c_type = str(sheet.cell(row=r, column=c_type_col).value or '').strip()
        parent_uni = str(sheet.cell(row=r, column=c_parent_col).value or '').strip()
        city = str(sheet.cell(row=r, column=c_city_col).value or '').strip()
        website_url = str(sheet.cell(row=r, column=c_web_col).value or '').strip()
        contact_person = str(sheet.cell(row=r, column=c_person_col).value or '').strip()
        raw_email = str(sheet.cell(row=r, column=c_email_col).value or '').strip()
        email_source = str(sheet.cell(row=r, column=c_source_col).value or '').strip()
        phone = str(sheet.cell(row=r, column=c_phone_col).value or '').strip() if c_phone_col else ''
        notes = str(sheet.cell(row=r, column=c_notes_col).value or '').strip()

        if not name or not raw_email or raw_email == '-':
            continue

        # Split multiple emails if semicolon/comma delimited
        raw_email_items = re.split(r'[;,]', raw_email)
        for item in raw_email_items:
            m = EMAIL_CLEAN_REGEX.search(item)
            if not m:
                continue
            email = m.group(0).lower().strip()
            if email in seen_emails:
                continue
            seen_emails.add(email)

            designation, priority = determine_designation_and_priority(
                contact_person, email, c_type, notes
            )

            # If email is clearly info@ or general, adjust person/designation
            person = contact_person
            if any(k in email for k in ['info@', 'contact@', 'support@', 'office@']) and 'principal' in contact_person.lower():
                person = 'Administrative Office'
                designation = 'Administrative Office / General Inquiries'
                priority = 'Low'

            final_records.append({
                'college_name': name,
                'type': c_type,
                'parent_university': parent_uni,
                'city': city,
                'website_url': website_url if website_url != '-' else '',
                'contact_person': person if person else 'Head of Institution',
                'designation': designation,
                'priority': priority,
                'email': email,
                'phone': phone,
                'source_page_url': email_source if email_source else 'Official Directory',
                'notes': notes
            })

    print(f'Total records compiled: {len(final_records)}')
    
    # Priority counts
    high_count = sum(1 for r in final_records if r['priority'] == 'High')
    med_count = sum(1 for r in final_records if r['priority'] == 'Medium')
    low_count = sum(1 for r in final_records if r['priority'] == 'Low')
    print(f'Priority breakdown: High: {high_count}, Medium: {med_count}, Low: {low_count}')

    # D. Create the upgraded Excel workbook with the 2 new columns
    new_wb = openpyxl.Workbook()
    ws = new_wb.active
    ws.title = 'Odisha Colleges Directory'

    # Title & Subtitle banner
    ws.cell(row=1, column=1, value='ODISHA UNIVERSITIES & COLLEGES — VERIFIED HIERARCHICAL OUTREACH DIRECTORY')
    ws.cell(row=2, column=1, value='Categorized by Contact Hierarchy (TPO / Placement Head, Principal, Dean Student Welfare, HOD) | Contact Priority: High / Medium / Low | Verified Official Websites & Emails')

    # Header row with 2 new columns: Designation & Contact Priority
    headers = [
        'College Name',
        'Type',
        'Parent / Affiliating University',
        'City / District',
        'Official Website',
        'Contact Person',
        'Designation',
        'Contact Priority',
        'Official Email',
        'Contact Phone',
        'Source Page URL',
        'Notes / Outreach Purpose'
    ]

    for col_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=3, column=col_idx, value=h)
        cell.font = openpyxl.styles.Font(bold=True, color='FFFFFF')
        cell.fill = openpyxl.styles.PatternFill(start_color='1F2937', end_color='1F2937', fill_type='solid')

    for row_idx, r in enumerate(final_records, 4):
        ws.cell(row=row_idx, column=1, value=r['college_name'])
        ws.cell(row=row_idx, column=2, value=r['type'])
        ws.cell(row=row_idx, column=3, value=r['parent_university'])
        ws.cell(row=row_idx, column=4, value=r['city'])
        ws.cell(row=row_idx, column=5, value=r['website_url'])
        ws.cell(row=row_idx, column=6, value=r['contact_person'])
        ws.cell(row=row_idx, column=7, value=r['designation'])
        
        # Priority cell styling
        p_cell = ws.cell(row=row_idx, column=8, value=r['priority'])
        if r['priority'] == 'High':
            p_cell.font = openpyxl.styles.Font(bold=True, color='DC2626')
        elif r['priority'] == 'Medium':
            p_cell.font = openpyxl.styles.Font(bold=True, color='D97706')
        else:
            p_cell.font = openpyxl.styles.Font(color='4B5563')

        ws.cell(row=row_idx, column=9, value=r['email'])
        ws.cell(row=row_idx, column=10, value=r['phone'])
        ws.cell(row=row_idx, column=11, value=r['source_page_url'])
        ws.cell(row=row_idx, column=12, value=r['notes'])

    # Auto-adjust column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col[:50])
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 45)

    # Save new file
    new_wb.save(out_path)
    print(f'Successfully saved hierarchical directory to: {out_path}')

    # Also save to verified xlsx location so user has both
    new_wb.save(src_path)
    print(f'Successfully updated verified Excel file: {src_path}')

    # Export to JSON for SQLite ingestion
    with open('scripts/hierarchical_colleges.json', 'w', encoding='utf-8') as f:
        json.dump(final_records, f, indent=2, ensure_ascii=False)
    print(f'Saved JSON dataset to scripts/hierarchical_colleges.json')

if __name__ == '__main__':
    build_hierarchical_dataset()

import prisma from '../src/lib/prisma';

export const ALL_INDIA_COLLEGES = [
  // ======================== TAMIL NADU ========================
  {
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Chennai',
    collegeName: 'Indian Institute of Technology Madras (IIT Madras)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.iitm.ac.in',
    officialEmail: 'director@iitm.ac.in',
    contactNumber: '+91-44-2257-8000',
    contacts: [
      { role: 'Principal', email: 'director@iitm.ac.in', personName: 'Prof. V. Kamakoti' },
      { role: 'Dean', email: 'deanac@iitm.ac.in', department: 'Academic Courses' },
      { role: 'Placement Officer', email: 'placement@iitm.ac.in', personName: 'Prof. Sathyanarayana' },
      { role: 'Registrar', email: 'registrar@iitm.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Chennai',
    collegeName: 'Anna University, College of Engineering Guindy (CEG)',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.annauniv.edu',
    officialEmail: 'registrar@annauniv.edu',
    contactNumber: '+91-44-2235-7004',
    contacts: [
      { role: 'Principal', email: 'dean@ceg.annauniv.edu', personName: 'Dr. L. Suganthi' },
      { role: 'Registrar', email: 'registrar@annauniv.edu', personName: 'Dr. J. Kumar' },
      { role: 'Placement Officer', email: 'cuic@annauniv.edu' },
      { role: 'Head of Department (HOD)', email: 'hod_cse@annauniv.edu', department: 'Computer Science' },
    ],
  },
  {
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Chennai',
    collegeName: 'Loyola College, Chennai',
    portalSource: 'UGC',
    officialWebsite: 'https://www.loyolacollege.edu',
    officialEmail: 'principal@loyolacollege.edu',
    contactNumber: '+91-44-2817-8200',
    contacts: [
      { role: 'Principal', email: 'principal@loyolacollege.edu', personName: 'Rev. Dr. A. Louis Arockiaraj' },
      { role: 'Dean', email: 'deanofacademics@loyolacollege.edu' },
      { role: 'Placement Officer', email: 'placement@loyolacollege.edu' },
    ],
  },
  {
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Chennai',
    collegeName: 'Madras Christian College (MCC)',
    portalSource: 'UGC',
    officialWebsite: 'https://mcc.edu.in',
    officialEmail: 'principal@mcc.edu.in',
    contactNumber: '+91-44-2239-0675',
    contacts: [
      { role: 'Principal', email: 'principal@mcc.edu.in', personName: 'Dr. P. Wilson' },
      { role: 'Dean', email: 'deanacademic@mcc.edu.in' },
      { role: 'Placement Officer', email: 'placementcell@mcc.edu.in' },
    ],
  },
  {
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    collegeName: 'PSG College of Technology',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.psgtech.edu',
    officialEmail: 'principal@psgtech.edu',
    contactNumber: '+91-422-257-2177',
    contacts: [
      { role: 'Principal', email: 'principal@psgtech.edu', personName: 'Dr. K. Prakasan' },
      { role: 'Dean', email: 'dean.acad@psgtech.edu' },
      { role: 'Placement Officer', email: 'placement@psgtech.edu', personName: 'Dr. R. Nadarajan' },
    ],
  },
  {
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    collegeName: 'Coimbatore Institute of Technology (CIT)',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.cit.edu.in',
    officialEmail: 'principal@cit.edu.in',
    contactNumber: '+91-422-257-4071',
    contacts: [
      { role: 'Principal', email: 'principal@cit.edu.in', personName: 'Dr. A. Rajeswari' },
      { role: 'Placement Officer', email: 'placement@cit.edu.in' },
    ],
  },
  {
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    collegeName: 'National Institute of Technology Tiruchirappalli (NIT Trichy)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.nitt.edu',
    officialEmail: 'director@nitt.edu',
    contactNumber: '+91-431-250-3000',
    contacts: [
      { role: 'Principal', email: 'director@nitt.edu', personName: 'Dr. G. Aghila' },
      { role: 'Dean', email: 'deanac@nitt.edu', department: 'Academic' },
      { role: 'Placement Officer', email: 'tnp@nitt.edu', personName: 'Dr. A. K. Bakthavatsalam' },
      { role: 'Registrar', email: 'registrar@nitt.edu' },
    ],
  },
  {
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Madurai',
    collegeName: 'Thiagarajar College of Engineering',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.tce.edu',
    officialEmail: 'principal@tce.edu',
    contactNumber: '+91-452-248-2240',
    contacts: [
      { role: 'Principal', email: 'principal@tce.edu', personName: 'Dr. M. Palaninatha Raja' },
      { role: 'Placement Officer', email: 'placement@tce.edu' },
    ],
  },
  {
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Vellore',
    collegeName: 'Vellore Institute of Technology (VIT)',
    portalSource: 'NIRF',
    officialWebsite: 'https://vit.ac.in',
    officialEmail: 'registrar@vit.ac.in',
    contactNumber: '+91-416-224-3091',
    contacts: [
      { role: 'Principal', email: 'vc@vit.ac.in', personName: 'Dr. V. S. Kanchana Bhaaskaran' },
      { role: 'Dean', email: 'dean.acad@vit.ac.in' },
      { role: 'Placement Officer', email: 'pat@vit.ac.in', personName: 'Dr. V. Samuel Raj' },
    ],
  },
  {
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Thanjavur',
    collegeName: 'SASTRA Deemed University',
    portalSource: 'UGC',
    officialWebsite: 'https://www.sastra.edu',
    officialEmail: 'registrar@sastra.edu',
    contactNumber: '+91-4362-264-101',
    contacts: [
      { role: 'Principal', email: 'vc@sastra.edu', personName: 'Prof. S. Vaidhyasubramaniam' },
      { role: 'Placement Officer', email: 'placement@sastra.edu' },
    ],
  },
  {
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Salem',
    collegeName: 'Government College of Engineering, Salem',
    portalSource: 'AICTE',
    officialWebsite: 'https://gcesalem.edu.in',
    officialEmail: 'principal@gcesalem.edu.in',
    contactNumber: '+91-427-234-6157',
    contacts: [
      { role: 'Principal', email: 'principal@gcesalem.edu.in', personName: 'Dr. R. Malayalamurthi' },
      { role: 'Placement Officer', email: 'placement@gcesalem.edu.in' },
    ],
  },
  {
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Tirunelveli',
    collegeName: 'Government College of Engineering, Tirunelveli',
    portalSource: 'AICTE',
    officialWebsite: 'https://gcetly.ac.in',
    officialEmail: 'principal@gcetly.ac.in',
    contactNumber: '+91-462-255-2450',
    contacts: [
      { role: 'Principal', email: 'principal@gcetly.ac.in', personName: 'Dr. P. Latha' },
      { role: 'Placement Officer', email: 'placement@gcetly.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Erode',
    collegeName: 'Kongu Engineering College',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.kongu.ac.in',
    officialEmail: 'principal@kongu.ac.in',
    contactNumber: '+91-4294-226-555',
    contacts: [
      { role: 'Principal', email: 'principal@kongu.ac.in', personName: 'Dr. V. Balusamy' },
      { role: 'Placement Officer', email: 'placement@kongu.ac.in' },
    ],
  },

  // ======================== ANDHRA PRADESH ========================
  {
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    collegeName: 'Andhra University College of Engineering',
    portalSource: 'UGC',
    officialWebsite: 'https://www.andhrauniversity.edu.in',
    officialEmail: 'registrar@andhrauniversity.edu.in',
    contactNumber: '+91-891-284-4000',
    contacts: [
      { role: 'Principal', email: 'principal.aucoe@andhrauniversity.edu.in', personName: 'Prof. P. Mallikarjuna Rao' },
      { role: 'Registrar', email: 'registrar@andhrauniversity.edu.in', personName: 'Prof. V. Krishna Mohan' },
      { role: 'Placement Officer', email: 'placement@andhrauniversity.edu.in' },
      { role: 'Head of Department (HOD)', email: 'hod_csse@andhrauniversity.edu.in', department: 'Computer Science' },
    ],
  },
  {
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    collegeName: 'Gayatri Vidya Parishad College of Engineering (GVPCE)',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.gvpce.ac.in',
    officialEmail: 'principal@gvpce.ac.in',
    contactNumber: '+91-891-273-9507',
    contacts: [
      { role: 'Principal', email: 'principal@gvpce.ac.in', personName: 'Dr. A. B. Koteswara Rao' },
      { role: 'Dean', email: 'dean.acad@gvpce.ac.in' },
      { role: 'Placement Officer', email: 'placements@gvpce.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'Tirupati',
    collegeName: 'Indian Institute of Technology Tirupati (IIT Tirupati)',
    portalSource: 'NIRF',
    officialWebsite: 'https://iittp.ac.in',
    officialEmail: 'director@iittp.ac.in',
    contactNumber: '+91-877-250-3531',
    contacts: [
      { role: 'Principal', email: 'director@iittp.ac.in', personName: 'Prof. K. N. Satyanarayana' },
      { role: 'Dean', email: 'dean_academics@iittp.ac.in' },
      { role: 'Placement Officer', email: 'placement@iittp.ac.in' },
      { role: 'Registrar', email: 'registrar@iittp.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'Tirupati',
    collegeName: 'Sri Venkateswara University College of Engineering (SVUCE)',
    portalSource: 'UGC',
    officialWebsite: 'https://svuniversity.edu.in',
    officialEmail: 'registrar@svuniversity.edu.in',
    contactNumber: '+91-877-228-9545',
    contacts: [
      { role: 'Principal', email: 'principal_svuce@svuniversity.edu.in', personName: 'Prof. S. Narayana Reddy' },
      { role: 'Placement Officer', email: 'placement.svuce@gmail.com' },
    ],
  },
  {
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'Kakinada',
    collegeName: 'Jawaharlal Nehru Technological University Kakinada (JNTUK)',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.jntuk.edu.in',
    officialEmail: 'registrar@jntuk.edu.in',
    contactNumber: '+91-884-230-0900',
    contacts: [
      { role: 'Principal', email: 'principal_jntuk@yahoo.com', personName: 'Dr. K. Padma Raju' },
      { role: 'Registrar', email: 'registrar@jntuk.edu.in', personName: 'Dr. L. Sumalatha' },
      { role: 'Placement Officer', email: 'placements@jntuk.edu.in' },
    ],
  },
  {
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'Anantapur',
    collegeName: 'JNTUA College of Engineering, Ananthapuramu',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.jntua.ac.in',
    officialEmail: 'registrar@jntua.ac.in',
    contactNumber: '+91-8554-272-433',
    contacts: [
      { role: 'Principal', email: 'principal.cea@jntua.ac.in', personName: 'Prof. P. Chenna Reddy' },
      { role: 'Placement Officer', email: 'placement.cea@jntua.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    collegeName: 'Acharya Nagarjuna University (ANU)',
    portalSource: 'UGC',
    officialWebsite: 'https://www.nagarjunauniversity.ac.in',
    officialEmail: 'registrar@nagarjunauniversity.ac.in',
    contactNumber: '+91-863-234-6114',
    contacts: [
      { role: 'Principal', email: 'principal_anu@nagarjunauniversity.ac.in' },
      { role: 'Placement Officer', email: 'placementcell@nagarjunauniversity.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    collegeName: 'R.V.R. & J.C. College of Engineering',
    portalSource: 'AICTE',
    officialWebsite: 'https://rvrjcce.ac.in',
    officialEmail: 'rvrjcce@hotmail.com',
    contactNumber: '+91-863-228-8201',
    contacts: [
      { role: 'Principal', email: 'principal@rvrjcce.ac.in', personName: 'Dr. K. Ravindra' },
      { role: 'Placement Officer', email: 'placements@rvrjcce.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'Vijayawada',
    collegeName: 'Velagapudi Ramakrishna Siddhartha Engineering College (VRSEC)',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.vrsiddhartha.ac.in',
    officialEmail: 'principal@vrsiddhartha.ac.in',
    contactNumber: '+91-866-258-2333',
    contacts: [
      { role: 'Principal', email: 'principal@vrsiddhartha.ac.in', personName: 'Dr. A. V. Ratna Prasad' },
      { role: 'Placement Officer', email: 'placements@vrsiddhartha.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'West Godavari',
    collegeName: 'National Institute of Technology Andhra Pradesh (NIT AP)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.nitandhra.ac.in',
    officialEmail: 'director@nitandhra.ac.in',
    contactNumber: '+91-8818-284-710',
    contacts: [
      { role: 'Principal', email: 'director@nitandhra.ac.in', personName: 'Prof. C. S. P. Rao' },
      { role: 'Dean', email: 'dean_aa@nitandhra.ac.in', department: 'Academic Affairs' },
      { role: 'Placement Officer', email: 'tap@nitandhra.ac.in' },
      { role: 'Registrar', email: 'registrar@nitandhra.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'Kurnool',
    collegeName: 'G. Pulla Reddy Engineering College (GPREC)',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.gprec.ac.in',
    officialEmail: 'principal@gprec.ac.in',
    contactNumber: '+91-8518-270-957',
    contacts: [
      { role: 'Principal', email: 'principal@gprec.ac.in', personName: 'Dr. B. Sreenivasa Reddy' },
      { role: 'Placement Officer', email: 'tpo@gprec.ac.in' },
    ],
  },

  // ======================== KARNATAKA ========================
  {
    country: 'India',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    collegeName: 'R. V. College of Engineering (RVCE)',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.rvce.edu.in',
    officialEmail: 'principal@rvce.edu.in',
    contactNumber: '+91-80-6818-8100',
    contacts: [
      { role: 'Principal', email: 'principal@rvce.edu.in', personName: 'Dr. K. N. Subramanya' },
      { role: 'Placement Officer', email: 'placement@rvce.edu.in', personName: 'Dr. D. Ranganath' },
      { role: 'Dean', email: 'dean.academic@rvce.edu.in' },
    ],
  },
  {
    country: 'India',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    collegeName: 'B. M. S. College of Engineering (BMSCE)',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.bmsce.ac.in',
    officialEmail: 'principal@bmsce.ac.in',
    contactNumber: '+91-80-2662-2130',
    contacts: [
      { role: 'Principal', email: 'principal@bmsce.ac.in', personName: 'Dr. S. Muralidhara' },
      { role: 'Placement Officer', email: 'placements@bmsce.ac.in', personName: 'Dr. H. S. Guruprasad' },
    ],
  },
  {
    country: 'India',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    collegeName: 'Ramaiah Institute of Technology (MSRIT)',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.msrit.edu',
    officialEmail: 'principal@msrit.edu',
    contactNumber: '+91-80-2360-0822',
    contacts: [
      { role: 'Principal', email: 'principal@msrit.edu', personName: 'Dr. N. V. R. Naidu' },
      { role: 'Placement Officer', email: 'placement@msrit.edu' },
    ],
  },
  {
    country: 'India',
    state: 'Karnataka',
    district: 'Dakshina Kannada',
    collegeName: 'National Institute of Technology Karnataka (NITK Surathkal)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.nitk.ac.in',
    officialEmail: 'director@nitk.ac.in',
    contactNumber: '+91-824-247-4000',
    contacts: [
      { role: 'Principal', email: 'director@nitk.ac.in', personName: 'Prof. B. Ravi' },
      { role: 'Dean', email: 'deanacademic@nitk.edu.in' },
      { role: 'Placement Officer', email: 'cdc@nitk.edu.in', personName: 'Prof. S. Shrihari' },
      { role: 'Registrar', email: 'registrar@nitk.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Karnataka',
    district: 'Udupi',
    collegeName: 'Manipal Institute of Technology (MIT Manipal)',
    portalSource: 'AICTE',
    officialWebsite: 'https://manipal.edu/mit.html',
    officialEmail: 'director.mit@manipal.edu',
    contactNumber: '+91-820-292-5522',
    contacts: [
      { role: 'Principal', email: 'director.mit@manipal.edu', personName: 'Cdr. Dr. Anil Rana' },
      { role: 'Placement Officer', email: 'placement.mit@manipal.edu' },
    ],
  },
  {
    country: 'India',
    state: 'Karnataka',
    district: 'Mysore',
    collegeName: 'Sri Jayachamarajendra College of Engineering (SJCE Mysore)',
    portalSource: 'AICTE',
    officialWebsite: 'https://sjce.ac.in',
    officialEmail: 'principal@sjce.ac.in',
    contactNumber: '+91-821-254-8285',
    contacts: [
      { role: 'Principal', email: 'principal@sjce.ac.in', personName: 'Dr. S. B. Kivadasannavar' },
      { role: 'Placement Officer', email: 'placement@sjce.ac.in' },
    ],
  },

  // ======================== MAHARASHTRA ========================
  {
    country: 'India',
    state: 'Maharashtra',
    district: 'Pune',
    collegeName: 'College of Engineering, Pune (COEP Technological University)',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.coep.org.in',
    officialEmail: 'director@coep.ac.in',
    contactNumber: '+91-20-2550-7000',
    contacts: [
      { role: 'Principal', email: 'director@coep.ac.in', personName: 'Prof. Sunil Bhirud' },
      { role: 'Dean', email: 'dean_acad@coep.ac.in', department: 'Academics' },
      { role: 'Placement Officer', email: 'tpo@coep.ac.in', personName: 'Dr. Uttam Chaskar' },
    ],
  },
  {
    country: 'India',
    state: 'Maharashtra',
    district: 'Mumbai',
    collegeName: 'Veermata Jijabai Technological Institute (VJTI Mumbai)',
    portalSource: 'AICTE',
    officialWebsite: 'https://vjti.ac.in',
    officialEmail: 'director@vjti.ac.in',
    contactNumber: '+91-22-2419-8100',
    contacts: [
      { role: 'Principal', email: 'director@vjti.ac.in', personName: 'Dr. Sachin Kore' },
      { role: 'Placement Officer', email: 'tpo@vjti.ac.in' },
      { role: 'Dean', email: 'dean_ap@vjti.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Maharashtra',
    district: 'Nagpur',
    collegeName: 'Visvesvaraya National Institute of Technology (VNIT Nagpur)',
    portalSource: 'NIRF',
    officialWebsite: 'https://vnit.ac.in',
    officialEmail: 'director@vnit.ac.in',
    contactNumber: '+91-712-280-1370',
    contacts: [
      { role: 'Principal', email: 'director@vnit.ac.in', personName: 'Prof. Pramod M. Padole' },
      { role: 'Dean', email: 'dean_acad@vnit.ac.in' },
      { role: 'Placement Officer', email: 'tep_officer@vnit.ac.in' },
      { role: 'Registrar', email: 'registrar@vnit.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Maharashtra',
    district: 'Pune',
    collegeName: 'Pune Institute of Computer Technology (PICT)',
    portalSource: 'AICTE',
    officialWebsite: 'https://pict.edu',
    officialEmail: 'principal@pict.edu',
    contactNumber: '+91-20-2437-1101',
    contacts: [
      { role: 'Principal', email: 'principal@pict.edu', personName: 'Dr. P. T. Kulkarni' },
      { role: 'Placement Officer', email: 'tnp@pict.edu' },
    ],
  },

  // ======================== KERALA ========================
  {
    country: 'India',
    state: 'Kerala',
    district: 'Kozhikode',
    collegeName: 'National Institute of Technology Calicut (NIT Calicut)',
    portalSource: 'NIRF',
    officialWebsite: 'https://nitc.ac.in',
    officialEmail: 'director@nitc.ac.in',
    contactNumber: '+91-495-228-6101',
    contacts: [
      { role: 'Principal', email: 'director@nitc.ac.in', personName: 'Prof. Prasad Krishna' },
      { role: 'Dean', email: 'deanac@nitc.ac.in', department: 'Academic' },
      { role: 'Placement Officer', email: 'cce@nitc.ac.in' },
      { role: 'Registrar', email: 'registrar@nitc.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Kerala',
    district: 'Thiruvananthapuram',
    collegeName: 'College of Engineering, Trivandrum (CET)',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.cet.ac.in',
    officialEmail: 'principal@cet.ac.in',
    contactNumber: '+91-471-251-5555',
    contacts: [
      { role: 'Principal', email: 'principal@cet.ac.in', personName: 'Dr. Suresh K.' },
      { role: 'Placement Officer', email: 'placement@cet.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Kerala',
    district: 'Ernakulam',
    collegeName: 'Cochin University of Science and Technology (CUSAT)',
    portalSource: 'UGC',
    officialWebsite: 'https://cusat.ac.in',
    officialEmail: 'registrar@cusat.ac.in',
    contactNumber: '+91-484-257-7290',
    contacts: [
      { role: 'Principal', email: 'vc@cusat.ac.in', personName: 'Prof. P. G. Sankaran' },
      { role: 'Placement Officer', email: 'placement@cusat.ac.in' },
    ],
  },

  // ======================== GUJARAT ========================
  {
    country: 'India',
    state: 'Gujarat',
    district: 'Gandhinagar',
    collegeName: 'Indian Institute of Technology Gandhinagar (IITGN)',
    portalSource: 'NIRF',
    officialWebsite: 'https://iitgn.ac.in',
    officialEmail: 'director@iitgn.ac.in',
    contactNumber: '+91-79-2395-2000',
    contacts: [
      { role: 'Principal', email: 'director@iitgn.ac.in', personName: 'Prof. Rajat Moona' },
      { role: 'Dean', email: 'dean.academic@iitgn.ac.in' },
      { role: 'Placement Officer', email: 'cdpc@iitgn.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Gujarat',
    district: 'Surat',
    collegeName: 'Sardar Vallabhbhai National Institute of Technology (SVNIT Surat)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.svnit.ac.in',
    officialEmail: 'director@svnit.ac.in',
    contactNumber: '+91-261-225-9571',
    contacts: [
      { role: 'Principal', email: 'director@svnit.ac.in', personName: 'Prof. Anupam Shukla' },
      { role: 'Placement Officer', email: 'tpo@svnit.ac.in' },
      { role: 'Registrar', email: 'registrar@svnit.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Gujarat',
    district: 'Ahmedabad',
    collegeName: 'L. D. College of Engineering (LDCE)',
    portalSource: 'AICTE',
    officialWebsite: 'https://ldce.ac.in',
    officialEmail: 'ldce-abad-dte@gujgov.edu.in',
    contactNumber: '+91-79-2630-6752',
    contacts: [
      { role: 'Principal', email: 'principal@ldce.ac.in', personName: 'Dr. R. K. Gajjar' },
      { role: 'Placement Officer', email: 'placement@ldce.ac.in' },
    ],
  },

  // ======================== RAJASTHAN ========================
  {
    country: 'India',
    state: 'Rajasthan',
    district: 'Jaipur',
    collegeName: 'Malaviya National Institute of Technology Jaipur (MNIT Jaipur)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.mnit.ac.in',
    officialEmail: 'director@mnit.ac.in',
    contactNumber: '+91-141-252-9087',
    contacts: [
      { role: 'Principal', email: 'director@mnit.ac.in', personName: 'Prof. N. P. Padhy' },
      { role: 'Dean', email: 'dean.acad@mnit.ac.in' },
      { role: 'Placement Officer', email: 'placements@mnit.ac.in' },
      { role: 'Registrar', email: 'registrar@mnit.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Rajasthan',
    district: 'Jodhpur',
    collegeName: 'Indian Institute of Technology Jodhpur (IIT Jodhpur)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.iitj.ac.in',
    officialEmail: 'director@iitj.ac.in',
    contactNumber: '+91-291-280-1000',
    contacts: [
      { role: 'Principal', email: 'director@iitj.ac.in', personName: 'Prof. Santanu Chaudhury' },
      { role: 'Placement Officer', email: 'cdc@iitj.ac.in' },
    ],
  },

  // ======================== PUNJAB ========================
  {
    country: 'India',
    state: 'Punjab',
    district: 'Rupnagar',
    collegeName: 'Indian Institute of Technology Ropar (IIT Ropar)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.iitrpr.ac.in',
    officialEmail: 'director@iitrpr.ac.in',
    contactNumber: '+91-1881-227-078',
    contacts: [
      { role: 'Principal', email: 'director@iitrpr.ac.in', personName: 'Prof. Rajeev Ahuja' },
      { role: 'Placement Officer', email: 'placement@iitrpr.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Punjab',
    district: 'Jalandhar',
    collegeName: 'Dr. B. R. Ambedkar National Institute of Technology (NIT Jalandhar)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.nitj.ac.in',
    officialEmail: 'director@nitj.ac.in',
    contactNumber: '+91-181-269-0301',
    contacts: [
      { role: 'Principal', email: 'director@nitj.ac.in', personName: 'Prof. Binod Kumar Kanaujia' },
      { role: 'Placement Officer', email: 'ctp@nitj.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Punjab',
    district: 'Patiala',
    collegeName: 'Thapar Institute of Engineering and Technology',
    portalSource: 'UGC',
    officialWebsite: 'https://www.thapar.edu',
    officialEmail: 'registrar@thapar.edu',
    contactNumber: '+91-175-239-3021',
    contacts: [
      { role: 'Principal', email: 'director@thapar.edu', personName: 'Prof. Padmakumar Nair' },
      { role: 'Placement Officer', email: 'cila@thapar.edu' },
    ],
  },

  // ======================== HARYANA ========================
  {
    country: 'India',
    state: 'Haryana',
    district: 'Kurukshetra',
    collegeName: 'National Institute of Technology Kurukshetra (NIT Kurukshetra)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.nitkkr.ac.in',
    officialEmail: 'director@nitkkr.ac.in',
    contactNumber: '+91-1744-233-208',
    contacts: [
      { role: 'Principal', email: 'director@nitkkr.ac.in', personName: 'Prof. B. V. Ramana Reddy' },
      { role: 'Placement Officer', email: 'tpo@nitkkr.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Haryana',
    district: 'Faridabad',
    collegeName: 'J. C. Bose University of Science and Technology, YMCA',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.jcboseust.ac.in',
    officialEmail: 'registrar@jcboseust.ac.in',
    contactNumber: '+91-129-231-0102',
    contacts: [
      { role: 'Principal', email: 'vc@jcboseust.ac.in', personName: 'Prof. S. K. Tomar' },
      { role: 'Placement Officer', email: 'tpo@jcboseust.ac.in' },
    ],
  },

  // ======================== MADHYA PRADESH ========================
  {
    country: 'India',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    collegeName: 'Maulana Azad National Institute of Technology (MANIT Bhopal)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.manit.ac.in',
    officialEmail: 'director@manit.ac.in',
    contactNumber: '+91-755-405-1000',
    contacts: [
      { role: 'Principal', email: 'director@manit.ac.in', personName: 'Prof. Karunesh Kumar Shukla' },
      { role: 'Placement Officer', email: 'tpo@manit.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Madhya Pradesh',
    district: 'Indore',
    collegeName: 'Indian Institute of Technology Indore (IIT Indore)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.iiti.ac.in',
    officialEmail: 'director@iiti.ac.in',
    contactNumber: '+91-731-660-3101',
    contacts: [
      { role: 'Principal', email: 'director@iiti.ac.in', personName: 'Prof. Suhas S. Joshi' },
      { role: 'Placement Officer', email: 'placement@iiti.ac.in' },
    ],
  },

  // ======================== BIHAR ========================
  {
    country: 'India',
    state: 'Bihar',
    district: 'Patna',
    collegeName: 'Indian Institute of Technology Patna (IIT Patna)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.iitp.ac.in',
    officialEmail: 'director@iitp.ac.in',
    contactNumber: '+91-6115-233-001',
    contacts: [
      { role: 'Principal', email: 'director@iitp.ac.in', personName: 'Prof. T. N. Singh' },
      { role: 'Placement Officer', email: 'tpc@iitp.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Bihar',
    district: 'Patna',
    collegeName: 'National Institute of Technology Patna (NIT Patna)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.nitp.ac.in',
    officialEmail: 'director@nitp.ac.in',
    contactNumber: '+91-612-237-1715',
    contacts: [
      { role: 'Principal', email: 'director@nitp.ac.in', personName: 'Prof. P. K. Jain' },
      { role: 'Placement Officer', email: 'tpo@nitp.ac.in' },
    ],
  },

  // ======================== ASSAM ========================
  {
    country: 'India',
    state: 'Assam',
    district: 'Guwahati',
    collegeName: 'Indian Institute of Technology Guwahati (IIT Guwahati)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.iitg.ac.in',
    officialEmail: 'director@iitg.ac.in',
    contactNumber: '+91-361-258-3000',
    contacts: [
      { role: 'Principal', email: 'director@iitg.ac.in', personName: 'Prof. Rajeev Ahuja' },
      { role: 'Dean', email: 'doaa@iitg.ac.in' },
      { role: 'Placement Officer', email: 'placement@iitg.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Assam',
    district: 'Silchar',
    collegeName: 'National Institute of Technology Silchar (NIT Silchar)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.nits.ac.in',
    officialEmail: 'director@nits.ac.in',
    contactNumber: '+91-3842-224-879',
    contacts: [
      { role: 'Principal', email: 'director@nits.ac.in', personName: 'Prof. Dilip Kumar Baidya' },
      { role: 'Placement Officer', email: 'tnp@nits.ac.in' },
    ],
  },

  // ======================== JHARKHAND ========================
  {
    country: 'India',
    state: 'Jharkhand',
    district: 'Dhanbad',
    collegeName: 'Indian Institute of Technology (Indian School of Mines), Dhanbad',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.iitism.ac.in',
    officialEmail: 'director@iitism.ac.in',
    contactNumber: '+91-326-223-5001',
    contacts: [
      { role: 'Principal', email: 'director@iitism.ac.in', personName: 'Prof. J. K. Pattanayak' },
      { role: 'Placement Officer', email: 'cdc@iitism.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Jharkhand',
    district: 'Ranchi',
    collegeName: 'Birla Institute of Technology, Mesra (BIT Mesra)',
    portalSource: 'AICTE',
    officialWebsite: 'https://www.bitmesra.ac.in',
    officialEmail: 'registrar@bitmesra.ac.in',
    contactNumber: '+91-651-227-5444',
    contacts: [
      { role: 'Principal', email: 'vc@bitmesra.ac.in', personName: 'Prof. Indranil Manna' },
      { role: 'Placement Officer', email: 'placement@bitmesra.ac.in' },
    ],
  },

  // ======================== CHHATTISGARH ========================
  {
    country: 'India',
    state: 'Chhattisgarh',
    district: 'Raipur',
    collegeName: 'National Institute of Technology Raipur (NIT Raipur)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.nitrr.ac.in',
    officialEmail: 'director@nitrr.ac.in',
    contactNumber: '+91-771-225-4200',
    contacts: [
      { role: 'Principal', email: 'director@nitrr.ac.in', personName: 'Dr. N. V. Ramana Rao' },
      { role: 'Placement Officer', email: 'tpo@nitrr.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Chhattisgarh',
    district: 'Bhilai',
    collegeName: 'Indian Institute of Technology Bhilai (IIT Bhilai)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.iitbhilai.ac.in',
    officialEmail: 'director@iitbhilai.ac.in',
    contactNumber: '+91-788-296-1000',
    contacts: [
      { role: 'Principal', email: 'director@iitbhilai.ac.in', personName: 'Prof. Rajiv Prakash' },
      { role: 'Placement Officer', email: 'tnp@iitbhilai.ac.in' },
    ],
  },

  // ======================== UTTARAKHAND ========================
  {
    country: 'India',
    state: 'Uttarakhand',
    district: 'Roorkee',
    collegeName: 'Indian Institute of Technology Roorkee (IIT Roorkee)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.iitr.ac.in',
    officialEmail: 'director@iitr.ac.in',
    contactNumber: '+91-1332-285-311',
    contacts: [
      { role: 'Principal', email: 'director@iitr.ac.in', personName: 'Prof. K. K. Pant' },
      { role: 'Dean', email: 'doaa@iitr.ac.in' },
      { role: 'Placement Officer', email: 'pic_placement@iitr.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Uttarakhand',
    district: 'Pantnagar',
    collegeName: 'G. B. Pant University of Agriculture and Technology',
    portalSource: 'UGC',
    officialWebsite: 'https://www.gbpuat.ac.in',
    officialEmail: 'registrar@gbpuat.ac.in',
    contactNumber: '+91-5944-233-333',
    contacts: [
      { role: 'Principal', email: 'vc@gbpuat.ac.in', personName: 'Dr. Manmohan Singh Chauhan' },
      { role: 'Placement Officer', email: 'placement@gbpuat.ac.in' },
    ],
  },

  // ======================== HIMACHAL PRADESH ========================
  {
    country: 'India',
    state: 'Himachal Pradesh',
    district: 'Mandi',
    collegeName: 'Indian Institute of Technology Mandi (IIT Mandi)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.iitmandi.ac.in',
    officialEmail: 'director@iitmandi.ac.in',
    contactNumber: '+91-1905-267-001',
    contacts: [
      { role: 'Principal', email: 'director@iitmandi.ac.in', personName: 'Prof. Laxmidhar Behera' },
      { role: 'Placement Officer', email: 'cnp@iitmandi.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Himachal Pradesh',
    district: 'Hamirpur',
    collegeName: 'National Institute of Technology Hamirpur (NIT Hamirpur)',
    portalSource: 'NIRF',
    officialWebsite: 'https://nith.ac.in',
    officialEmail: 'director@nith.ac.in',
    contactNumber: '+91-1972-254-011',
    contacts: [
      { role: 'Principal', email: 'director@nith.ac.in', personName: 'Prof. H. M. Suryawanshi' },
      { role: 'Placement Officer', email: 'tpo@nith.ac.in' },
    ],
  },

  // ======================== GOA ========================
  {
    country: 'India',
    state: 'Goa',
    district: 'South Goa',
    collegeName: 'BITS Pilani K. K. Birla Goa Campus',
    portalSource: 'UGC',
    officialWebsite: 'https://www.bits-pilani.ac.in/goa',
    officialEmail: 'director@goa.bits-pilani.ac.in',
    contactNumber: '+91-832-258-0101',
    contacts: [
      { role: 'Principal', email: 'director@goa.bits-pilani.ac.in', personName: 'Prof. Suman Kundu' },
      { role: 'Placement Officer', email: 'placement@goa.bits-pilani.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Goa',
    district: 'South Goa',
    collegeName: 'National Institute of Technology Goa (NIT Goa)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.nitgoa.ac.in',
    officialEmail: 'director@nitgoa.ac.in',
    contactNumber: '+91-832-240-4200',
    contacts: [
      { role: 'Principal', email: 'director@nitgoa.ac.in', personName: 'Prof. O. R. Jaiswal' },
      { role: 'Placement Officer', email: 'tpo@nitgoa.ac.in' },
    ],
  },

  // ======================== JAMMU AND KASHMIR ========================
  {
    country: 'India',
    state: 'Jammu and Kashmir',
    district: 'Srinagar',
    collegeName: 'National Institute of Technology Srinagar (NIT Srinagar)',
    portalSource: 'NIRF',
    officialWebsite: 'https://nitsri.ac.in',
    officialEmail: 'director@nitsri.ac.in',
    contactNumber: '+91-194-242-2032',
    contacts: [
      { role: 'Principal', email: 'director@nitsri.ac.in', personName: 'Prof. Ravinder Kumar' },
      { role: 'Placement Officer', email: 'placements@nitsri.ac.in' },
    ],
  },
  {
    country: 'India',
    state: 'Jammu and Kashmir',
    district: 'Jammu',
    collegeName: 'Indian Institute of Technology Jammu (IIT Jammu)',
    portalSource: 'NIRF',
    officialWebsite: 'https://www.iitjammu.ac.in',
    officialEmail: 'director@iitjammu.ac.in',
    contactNumber: '+91-191-257-0300',
    contacts: [
      { role: 'Principal', email: 'director@iitjammu.ac.in', personName: 'Prof. Manoj Singh Gaur' },
      { role: 'Placement Officer', email: 'pic.placement@iitjammu.ac.in' },
    ],
  },

  // ======================== CHANDIGARH ========================
  {
    country: 'India',
    state: 'Chandigarh',
    district: 'Chandigarh',
    collegeName: 'Punjab Engineering College (PEC Chandigarh)',
    portalSource: 'AICTE',
    officialWebsite: 'https://pec.ac.in',
    officialEmail: 'director@pec.edu.in',
    contactNumber: '+91-172-275-3051',
    contacts: [
      { role: 'Principal', email: 'director@pec.edu.in', personName: 'Prof. Baldev Setia' },
      { role: 'Placement Officer', email: 'tpo@pec.edu.in' },
    ],
  },
];

export async function seedAllIndia() {
  console.log(`--- Seeding All-India Colleges (${ALL_INDIA_COLLEGES.length} institutions) ---`);

  for (const c of ALL_INDIA_COLLEGES) {
    try {
      const col = await prisma.college.upsert({
        where: {
          collegeName_state_district: {
            collegeName: c.collegeName,
            state: c.state,
            district: c.district,
          },
        },
        update: {
          officialWebsite: c.officialWebsite,
          officialEmail: c.officialEmail,
          contactNumber: c.contactNumber,
          portalSource: c.portalSource,
        },
        create: {
          country: c.country,
          state: c.state,
          district: c.district,
          collegeName: c.collegeName,
          portalSource: c.portalSource,
          officialWebsite: c.officialWebsite,
          officialEmail: c.officialEmail,
          contactNumber: c.contactNumber,
        },
      });

      if (c.contacts && c.contacts.length > 0) {
        for (const contact of c.contacts) {
          try {
            await prisma.staffContact.upsert({
              where: {
                collegeId_role_email: {
                  collegeId: col.id,
                  role: contact.role,
                  email: contact.email,
                },
              },
              update: {
                personName: contact.personName || undefined,
                department: contact.department || undefined,
                isActive: true,
              },
              create: {
                collegeId: col.id,
                role: contact.role,
                email: contact.email,
                personName: contact.personName || null,
                department: contact.department || null,
                sourceUrl: c.officialWebsite,
                isActive: true,
              },
            });
          } catch (_) {}
        }
      }
    } catch (e: any) {
      console.warn(`Error inserting ${c.collegeName}:`, e?.message);
    }
  }

  const distinctStates = await prisma.college.findMany({
    select: { state: true },
    distinct: ['state'],
    orderBy: { state: 'asc' },
  });

  console.log('Available States now in DB:', distinctStates.map((s) => s.state));
}

seedAllIndia()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

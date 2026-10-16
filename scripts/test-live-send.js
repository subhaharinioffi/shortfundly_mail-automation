import { sendEmailMessage } from '../src/lib/mailer.js';

(async () => {
  console.log('Testing live email dispatch to subhahariniofficial@gmail.com...');
  try {
    const outcome = await sendEmailMessage({
      collegeName: 'Monarchs University',
      recipientEmail: 'subhahariniofficial@gmail.com',
      rawSubject: 'Proposal for Shortfundly Campus Collaboration - Empowering Student Creators at Monarchs University',
      rawBody: `PROPOSAL FOR SHORTFUNDLY CAMPUS COLLABORATION
Empowering Student Creators at Monarchs University

Dear Subhaharini,

Greetings from Shortfundly!

We propose a collaboration with Monarchs University through Shortfundly Campus to help students develop creative skills, showcase their work, and explore opportunities in filmmaking and digital content.

About Shortfundly Campus:
Shortfundly Campus connects student creators with collaboration, film submission, promotion, and event opportunities. Its Campus Pass brings together six products: Connect, Festival, Hub, Marketing, Ticket, and Tools. Students can build creator profiles, find collaborators, and prepare their projects for wider exposure.

Key Collaboration Highlights for Monarchs University:
- Student Onboarding & Creative Portfolios
- Hands-on Workshops in Filmmaking, OTT Distribution & AI
- Campus Screenings & Filmmaking Competitions
- Student Leadership & Campus Ambassador Program

We would welcome an opportunity to discuss this initiative with your department.

Contact: +91 93612 23155
Explore Campus: https://campus.shortfundly.com/

Warm regards,
Subhaharini
Product Manager | Shortfundly`,
      senderName: 'Subhaharini',
      sentByUser: 'Shortfundly Admin',
      bypassDuplicateCheck: true,
      variables: {
        college_name: 'Monarchs University',
        city: 'Bhubaneswar',
        department: 'School of Film, Media & Creative Arts',
        contact_person: 'Subhaharini',
        sender_name: 'Subhaharini',
        sender_role: 'Product Manager | Shortfundly'
      }
    });

    console.log('Live email outcome:', outcome);
  } catch (err) {
    console.error('Live email failed:', err);
  }
})();

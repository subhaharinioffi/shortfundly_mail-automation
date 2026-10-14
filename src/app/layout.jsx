import '@/styles/globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CinemaBackground from '@/components/CinemaBackground';

export const metadata = {
  title: "ShortFundly OTT marketplace - Campus Email Automation",
  description: "Enterprise email automation workflow for Shortfundly Campus outreach to colleges in Odisha.",
  icons: {
    icon: '/shortfundly-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="app-layout">
            <CinemaBackground />
            <Navbar />
            <main className="main-content">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

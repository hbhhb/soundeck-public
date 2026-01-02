import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Header } from "./Header";

export const TermsOfService: React.FC = () => {
  return (
    <>
    <Header />
    <div className="min-h-screen bg-background text-foreground-primary p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="gap-2 pl-0 -ml-6 hover:bg-transparent hover:text-primary">
              <ArrowLeft size={16} />
              Back to Soundeck
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2 font-['Sora']">Terms of Service</h1>
        <p className="text-sm text-foreground-tertiary mb-8">Effective Date: December 7, 2025</p>
        
        <div className="space-y-6 text-sm md:text-base text-foreground-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Soundeck, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service. By using the Service, you represent and warrant that you are at least 14 years of age (or the age of digital consent in your jurisdiction).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">2. Description of Service</h2>
            <p>
              Soundeck provides a web-based soundboard application for streamers and content creators. We offer both a free tier and storage capabilities for custom audio files.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">3. User Accounts</h2>
            <p>
              You must create an account via Google Sign-In to access certain features. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">4. User Content and Conduct</h2>
            <p className="mb-2">
              You retain all rights to the audio files you upload to Soundeck. By uploading content, you represent and warrant that:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You own the content or have the necessary rights to use and share it.</li>
              <li>The content does not violate any third-party rights, including copyright, trademark, or privacy rights.</li>
              <li>The content is not illegal, offensive, or harmful.</li>
            </ul>
            <p className="mt-2">
              We reserve the right to remove any content that violates these terms or for any other reason at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">5. Storage Limits</h2>
            <p>
              We provide a limited amount of storage for your custom audio files. The specific storage limits are described in the Service interface and may be changed by us at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">6. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">7. Disclaimer of Warranties</h2>
            <p>
              The service is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">8. Limitation of Liability</h2>
            <p>
              In no event shall Soundeck be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">9. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the Republic of Korea, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms will be brought exclusively in the courts located in the Republic of Korea.
            </p>
          </section>
        </div>
      </div>
    </div>
    </>
  );
};

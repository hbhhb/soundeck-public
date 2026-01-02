import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Header } from "./Header";

export const PrivacyPolicy: React.FC = () => {
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
        <h1 className="text-3xl font-bold mb-2 font-['Sora']">Privacy Policy</h1>
        <p className="text-sm text-foreground-tertiary mb-8">Effective Date: December 7, 2025</p>
        
        <div className="space-y-6 text-sm md:text-base text-foreground-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">1. Introduction</h2>
            <p>
              Soundeck ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our soundboard application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">2. Information We Collect</h2>
            <p className="mb-2">We collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Information:</strong> When you sign in with Google, we collect your email address and profile picture to identify you and personalize your experience.</li>
              <li><strong>User Content:</strong> We store the audio files you upload to our service.</li>
              <li><strong>Usage Data & Local Storage:</strong> We store your soundboard configuration (settings, hotkeys, layout) and use Local Storage technologies on your device to ensure zero-latency performance and remember your preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">3. How We Use Your Information</h2>
            <p>
              We use the collected information solely to provide and improve the Soundeck service. Specifically:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>To create and manage your account.</li>
              <li>To store and retrieve your custom soundboard configuration.</li>
              <li>To process and store your uploaded audio files.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">4. Data Storage and Security</h2>
            <p>
              Your data is stored securely using Supabase. We implement appropriate technical measures to protect your personal information. However, please note that no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">5. User Uploaded Content</h2>
            <p>
              You are responsible for the audio content you upload. We do not monitor all user content, but we reserve the right to remove any content that violates our Terms of Service or applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">6. User Rights & Data Deletion</h2>
            <p>
              You have the right to access, update, or delete your personal information at any time. You can delete your account and all associated data (including uploaded audio files) directly through the 'Delete Account' feature located in the settings page of the Service. Once initiated, this action is irreversible and your data will be permanently removed from our servers immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground-primary mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>
          </section>
        </div>
      </div>
    </div>
    </>
  );
};

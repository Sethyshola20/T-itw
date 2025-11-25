"use client";

import { ConnectionDialog } from "@/components/ConnectionDialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { MessageIcon } from "@/components/ui/icons";
import {
  FileText,
  Search,
  Zap,
  Clock,
  Shield,
  TrendingUp,
  CheckCircle2,
  Building2,
  FileSearch,
  BarChart3,
} from "lucide-react";

export default function Home() {
  const { data: session, error } = authClient.useSession();

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Gradient Background Elements */}
      <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-primary/15 to-primary/5 rounded-full blur-3xl opacity-40"></div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto text-center py-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          AI-Powered Document Intelligence
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Transform Engineering Documentation into Actionable Insights
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
          An intelligent AI assistant that analyzes, summarizes, and extracts critical information from complex building documentation helping engineering teams make faster, more confident decisions.
        </p>

        {error || !session ? (
          <ConnectionDialog />
        ) : (
          <Button asChild variant="cta" size="xl" className="shadow-lg">
            <Link href="/chat">
              <MessageIcon />
              Launch Assistant
            </Link>
          </Button>
        )}

        {/* Trust Indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Enterprise-Grade Security</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Save 70% of Review Time</span>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-24">
        <div className="group p-8 rounded-2xl bg-card hover:bg-accent/50 transition-all duration-300 border border-border text-left shadow-sm hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Intelligent Summarization</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Extract key technical specifications, project requirements, and critical constraints from extensive documentation in seconds, not hours.
          </p>
        </div>
        <div className="group p-8 rounded-2xl bg-card hover:bg-accent/50 transition-all duration-300 border border-border text-left shadow-sm hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Search className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Cross-Document Research</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Search across multiple documents, technical standards, and regulatory requirements with contextual AI-powered answers delivered instantly.
          </p>
        </div>
        <div className="group p-8 rounded-2xl bg-card hover:bg-accent/50 transition-all duration-300 border border-border text-left shadow-sm hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Automated Action Items</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Generate compliance checklists, risk assessments, and structured insights using advanced agentic AI workflows tailored to engineering projects.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Built for Engineering Excellence
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Designed specifically for the unique challenges faced by building and civil engineering firms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Accelerate Project Timelines</h3>
              <p className="text-muted-foreground text-sm">
                Reduce document review time from days to minutes. Get instant answers to technical queries without manually searching through hundreds of pages.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Ensure Compliance</h3>
              <p className="text-muted-foreground text-sm">
                Automatically identify regulatory requirements, building codes, and technical standards across your documentation with precision.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Improve Decision Quality</h3>
              <p className="text-muted-foreground text-sm">
                Make data-driven decisions backed by comprehensive analysis of all relevant documentation, reducing risk and improving project outcomes.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Scale Your Expertise</h3>
              <p className="text-muted-foreground text-sm">
                Empower junior engineers with AI-assisted analysis while freeing senior staff to focus on high-value strategic work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 bg-muted/30 rounded-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Powerful Use Cases
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From tender analysis to compliance verification AI assistance at every stage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-card border border-border">
            <FileSearch className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tender Document Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Quickly assess tender requirements, identify risks, and generate Go/No-Go recommendations based on comprehensive document analysis.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <CheckCircle2 className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Compliance Verification</h3>
            <p className="text-sm text-muted-foreground">
              Cross-reference project specifications against building regulations, safety standards, and environmental requirements automatically.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <BarChart3 className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Technical Comparison</h3>
            <p className="text-sm text-muted-foreground">
              Compare multiple design options, material specifications, or contractor proposals side-by-side with AI-generated insights.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-8">
            <div className="text-5xl font-bold text-primary mb-2">70%</div>
            <div className="text-muted-foreground">Faster Document Review</div>
          </div>
          <div className="p-8">
            <div className="text-5xl font-bold text-primary mb-2">95%</div>
            <div className="text-muted-foreground">Accuracy Rate</div>
          </div>
          <div className="p-8">
            <div className="text-5xl font-bold text-primary mb-2">24/7</div>
            <div className="text-muted-foreground">Always Available</div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 border-t border-border">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12">
          Frequently Asked Questions
        </h2>

        <Accordion
          type="single"
          collapsible
          className="w-full space-y-3 sm:space-y-4"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-base sm:text-lg font-medium text-left">
              How does the AI assistant work?
            </AccordionTrigger>
            <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Our AI assistant uses advanced natural language processing and retrieval-augmented generation (RAG) to analyze your engineering documents. It ingests PDFs and Word documents, understands technical context, and provides accurate answers based on the actual content of your files.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-base sm:text-lg font-medium text-left">
              What types of documents can I analyze?
            </AccordionTrigger>
            <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              The assistant supports a wide range of engineering documentation including tender documents, technical specifications, building regulations, safety standards, design drawings descriptions, contractor proposals, and compliance reports. Both PDF and Word document formats are supported.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-base sm:text-lg font-medium text-left">
              Is my data secure and confidential?
            </AccordionTrigger>
            <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Absolutely. We take data security seriously. All documents are processed securely, encrypted in transit and at rest. Your data is never shared with third parties, and we're fully GDPR compliant. You maintain complete ownership and control of your documents.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-base sm:text-lg font-medium text-left">
              Can it handle technical terminology and standards?
            </AccordionTrigger>
            <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Yes. The AI is trained to understand engineering and construction terminology, building codes, technical standards (including Eurocodes), and industry-specific language. It can accurately interpret complex technical requirements and regulatory frameworks.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-base sm:text-lg font-medium text-left">
              How accurate are the AI-generated insights?
            </AccordionTrigger>
            <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Our system achieves over 95% accuracy in extracting and summarizing information from technical documents. However, we always recommend that critical decisions be reviewed by qualified engineers. The AI is designed to augment human expertise, not replace it.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger className="text-base sm:text-lg font-medium text-left">
              What's the implementation process?
            </AccordionTrigger>
            <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Getting started is simple. Sign up, upload your documents, and start asking questions immediately. No complex setup or training required. Our team provides onboarding support to ensure you get maximum value from the platform from day one.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Document Workflow?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join engineering firms across Europe who are saving time and improving decision quality with AI-powered document intelligence.
          </p>
          {error || !session ? (
            <ConnectionDialog />
          ) : (
            <Button asChild variant="cta" size="xl" className="shadow-lg">
              <Link href="/chat">
                <MessageIcon />
                Get Started Now
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center text-sm text-muted-foreground py-8 border-t border-border mt-12">
        © {new Date().getFullYear()} Document Intelligence — Empowering Engineering Excellence
      </footer>

      <Toaster />
    </main>
  );
}

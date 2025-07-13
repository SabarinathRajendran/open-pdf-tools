import { Crop, RotateCw, Merge, Split } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { PATH } from './routes/path';

const tools = [
  { name: 'PDF Cropper', desc: 'Crop PDF pages precisely and quickly, all in your browser.', icon: <Crop />, path: PATH.crop, live: true },
  { name: 'PDF Rotator', desc: 'Rotate pages clockwise or counterclockwise with ease.', icon: <RotateCw />, path: '/pdf-rotator', live: false },
  { name: 'Merge PDFs', desc: 'Combine multiple PDF documents into one.', icon: <Merge />, path: '/merge-pdf', live: false },
  { name: 'Split PDF', desc: 'Break large PDFs into smaller, more manageable files.', icon: <Split />, path: '/split-pdf', live: false },
];

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>OpenPDF Tools | Local & Open-Source PDF Editor</title>
        <meta
          name="description"
          content="Free open-source PDF tools to crop, rotate, split, and merge PDF files – all locally on your browser. No uploads. 100% private and secure."
        />
        <link rel="canonical" href="https://openpdftools.sabarinath.dev/" />
        <meta property="og:title" content="OpenPDF Tools – Crop, Rotate, Merge & Split PDFs" />
        <meta
          property="og:description"
          content="Edit PDFs directly in your browser with no uploads. Free, open-source, and privacy-first PDF tools."
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <header className="py-6 bg-white shadow sticky top-0 z-10 transition-all duration-300">
        <nav className="container mx-auto flex justify-between items-center px-4">
          <h1 className="text-2xl font-bold text-blue-600 tracking-tight">OpenPDF Tools</h1>
          <ul className="hidden md:flex space-x-4 text-gray-700 font-medium">
            <li><a href="#tools" className="hover:text-blue-500 transition-colors">Tools</a></li>
            <li><a href="#benefits" className="hover:text-blue-500 transition-colors">Benefits</a></li>
            <li><a href="#platform" className="hover:text-blue-500 transition-colors">Platform</a></li>
          </ul>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16 space-y-24">
        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-6 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            Edit PDFs Locally — 100% Private, No Uploads
          </h2>
          <p className="text-lg text-gray-600">
            Your one-stop open-source toolkit to crop, rotate, merge, and split PDFs — completely offline and secure.
          </p>
          <a
            href="#crop"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition-all duration-300"
          >
            🚀 Launch PDF Cropper
          </a>
        </section>

        {/* Tools */}
        <section id="tools">
          <h3 className="text-3xl font-bold mb-8 text-center">🛠 Available PDF Tools</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {tools.map(tool => (
              <div
                key={tool.name}
                className={`p-6 rounded-xl border border-gray-300 shadow-xl ${
                  tool.live
                    ? 'bg-white hover:shadow-xl cursor-pointer transition-transform transform hover:scale-105'
                    : 'bg-gray-100 opacity-70'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3 text-xl text-gray-800">
                  <span className="text-blue-600">{tool.icon}</span>
                  <span className="font-semibold">{tool.name}</span>
                </div>
                <p className="text-gray-600 mb-4 text-sm">{tool.desc}</p>
                {tool.live ? (
                  <a href={tool.path} className="text-blue-600 hover:underline font-medium">
                    Open Tool →
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Coming Soon</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section id="benefits" className="animate-fade-in-up">
          <h3 className="text-3xl font-bold mb-10 text-center">🌟 Why Choose OpenPDF Tools?</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                title: '🛡️ 100% Private',
                text: 'No data leaves your computer — your PDFs are safe, processed in-browser.',
              },
              {
                title: '⚡ Lightning Fast',
                text: 'No server latency or upload wait times. Instant load and processing.',
              },
              {
                title: '🧩 Modular Toolkit',
                text: 'Pick and use only what you need — crop, rotate, split, or merge.',
              },
              {
                title: '🌍 Free & Open-Source',
                text: 'No subscriptions, no ads. Forever free and built by the community.',
              },
            ].map((benefit, i) => (
              <div key={i} className="bg-white shadow p-6 rounded-lg text-center hover:shadow-md transition">
                <h4 className="font-semibold text-lg">{benefit.title}</h4>
                <p className="text-gray-600 text-sm mt-2">{benefit.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Platform */}
        <section id="platform" className="text-center space-y-4 animate-fade-in-up">
          <h3 className="text-3xl font-bold">🧠 Powered by Your Browser</h3>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            No installations. No logins. No tracking. Everything runs in your browser using secure JavaScript and WebAssembly.
          </p>
        </section>
      </main>

      <footer className="bg-white border-t py-6 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} OpenPDF Tools. Free, local, and made with ❤️.
      </footer>
    </>
  );
}

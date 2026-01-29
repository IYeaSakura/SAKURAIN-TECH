import { useState, useEffect } from 'react';
import { ScrollProgress } from '@/components/effects';
import {
  Navigation,
  Hero,
  Services,
  TechStack,
  Pricing,
  Process,
  Comparison,
  Contact,
  Footer,
} from '@/components/sections';
import type { SiteData } from '@/types';
import './styles/globals.css';

function App() {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load site data from static JSON file
    fetch('/data/site-data.json')
      .then((res) => res.json())
      .then((data: SiteData) => {
        setSiteData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load site data:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (!siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <p className="text-slate-400 mb-4">无法加载网站数据</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-[#0a0a0f] min-h-screen">
      <ScrollProgress />
      <Navigation data={siteData.navigation} />
      <main>
        <Hero data={siteData.hero} />
        <Services data={siteData.services} />
        <TechStack data={siteData.techStack} />
        <Pricing data={siteData.pricing} />
        <Process data={siteData.process} />
        <Comparison data={siteData.comparison} />
        <Contact data={siteData.contact} />
      </main>
      <Footer data={siteData.footer} />
    </div>
  );
}

export default App;

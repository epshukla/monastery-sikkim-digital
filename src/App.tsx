import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Monasteries from "./pages/Monasteries";
import MonasteryDetail from "./pages/MonasteryDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/monasteries" element={<Monasteries />} />
          <Route path="/monastery/:id" element={<MonasteryDetail />} />
          {/* Additional routes for future pages */}
          <Route path="/tours" element={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold monastery-heading mb-4 text-gradient-gold">Virtual Tours</h1><p className="text-muted-foreground">Coming Soon - Immersive 360° monastery experiences</p></div></div>} />
          <Route path="/tours/:id" element={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold monastery-heading mb-4 text-gradient-gold">Virtual Tour</h1><p className="text-muted-foreground">Coming Soon - 360° experience for this monastery</p></div></div>} />
          <Route path="/archives" element={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold monastery-heading mb-4 text-gradient-gold">Digital Archives</h1><p className="text-muted-foreground">Coming Soon - Digitized manuscripts and artifacts</p></div></div>} />
          <Route path="/calendar" element={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold monastery-heading mb-4 text-gradient-gold">Cultural Calendar</h1><p className="text-muted-foreground">Coming Soon - Monastery events and festivals</p></div></div>} />
          <Route path="/community" element={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold monastery-heading mb-4 text-gradient-gold">Community Portal</h1><p className="text-muted-foreground">Coming Soon - Share your stories and experiences</p></div></div>} />
          <Route path="/support" element={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold monastery-heading mb-4 text-gradient-gold">Support Us</h1><p className="text-muted-foreground">Coming Soon - Help preserve Sikkim's heritage</p></div></div>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

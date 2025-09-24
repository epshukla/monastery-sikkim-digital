import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, MapPin, Calendar, Camera, 
  Maximize, RotateCcw, Share2, Download,
  Image as ImageIcon, Info, Play
} from "lucide-react";

interface Monastery {
  id: string;
  name: string;
  location: string;
  description: string;
  "360_image_url": string;
  thumbnail: string;
  photo_gallery: string[];
  tradition: string;
  founded: string;
}

const TourDetail = () => {
  const { id } = useParams();
  const [monastery, setMonastery] = useState<Monastery | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);

  useEffect(() => {
    const loadMonastery = async () => {
      try {
        const response = await fetch('/data/monasteries.json');
        const data = await response.json();
        const foundMonastery = data.find((m: Monastery) => m.id === id);
        setMonastery(foundMonastery || null);
        setLoading(false);
      } catch (error) {
        console.error('Error loading monastery:', error);
        setLoading(false);
      }
    };

    loadMonastery();
  }, [id]);

  useEffect(() => {
    if (monastery && viewerRef.current && !viewerLoaded) {
      // Load PhotoSphereViewer script dynamically
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/photo-sphere-viewer@5/dist/photo-sphere-viewer.js';
      script.onload = () => {
        // Initialize viewer
        if (window.PhotoSphereViewer && viewerRef.current) {
          try {
            viewerInstanceRef.current = new window.PhotoSphereViewer.Viewer({
              container: viewerRef.current,
              panorama: monastery["360_image_url"],
              caption: `${monastery.name} - Virtual Tour`,
              touchmoveTwoFingers: true,
              mousewheelCtrlKey: true,
              navbar: [
                'zoom',
                'move',
                'fullscreen',
                {
                  id: 'custom-button',
                  content: '🏠',
                  title: 'Reset View',
                  className: 'custom-button',
                  onClick: () => {
                    viewerInstanceRef.current?.animate({
                      yaw: 0,
                      pitch: 0,
                    });
                  }
                }
              ],
              loadingImg: '/placeholder.svg',
              size: {
                height: '500px'
              }
            });
            setViewerLoaded(true);
          } catch (error) {
            console.error('Error initializing PhotoSphereViewer:', error);
          }
        }
      };
      document.head.appendChild(script);

      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/photo-sphere-viewer@5/dist/photo-sphere-viewer.css';
      document.head.appendChild(link);

      return () => {
        if (viewerInstanceRef.current) {
          viewerInstanceRef.current.destroy();
        }
      };
    }
  }, [monastery, viewerLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-pulse text-2xl monastery-heading">Loading Virtual Tour...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!monastery) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold monastery-heading mb-4 text-gradient-gold">
              Tour Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              The virtual tour you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link to="/tours">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tours
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" asChild>
              <Link to="/tours">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tours
              </Link>
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-primary/90">
                  <Camera className="h-3 w-3 mr-1" />
                  360° Virtual Tour
                </Badge>
                <Badge variant="outline">{monastery.tradition} Tradition</Badge>
              </div>
              
              <h1 className="text-4xl font-bold monastery-heading mb-4">
                {monastery.name}
              </h1>
              
              <div className="flex items-center gap-6 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{monastery.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Founded {monastery.founded}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="monastery-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Tour Controls
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div>• Click and drag to look around</div>
                    <div>• Use mouse wheel to zoom</div>
                    <div>• Press fullscreen for immersive view</div>
                    <div>• Use reset button to return to start</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 360° Viewer */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card className="monastery-border overflow-hidden">
            <div className="relative">
              {!viewerLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading 360° viewer...</p>
                  </div>
                </div>
              )}
              <div 
                ref={viewerRef} 
                className="w-full"
                style={{ height: '500px' }}
              />
            </div>
          </Card>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="about" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="explore">Explore</TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card className="monastery-border">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold monastery-heading mb-4">
                    About {monastery.name}
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    {monastery.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Tradition</h3>
                      <p className="text-muted-foreground">{monastery.tradition} Buddhism</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Founded</h3>
                      <p className="text-muted-foreground">{monastery.founded}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Location</h3>
                      <p className="text-muted-foreground">{monastery.location}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Tour Type</h3>
                      <p className="text-muted-foreground">360° Virtual Experience</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gallery">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {monastery.photo_gallery.map((image, index) => (
                  <Card key={index} className="overflow-hidden group cursor-pointer hover:monastery-glow transition-all duration-300">
                    <div className="aspect-[4/3] relative">
                      <img
                        src={image}
                        alt={`${monastery.name} view ${index + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="explore">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="monastery-border">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Related Monasteries</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/tours/pemayangtse">
                          <Camera className="h-4 w-4 mr-2" />
                          Pemayangtse Monastery
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/tours/tashiding">
                          <Camera className="h-4 w-4 mr-2" />
                          Tashiding Monastery
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="monastery-border">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Discover More</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/archives">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          View Archives
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/monasteries">
                          <MapPin className="h-4 w-4 mr-2" />
                          All Monasteries
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

// Add PhotoSphereViewer to window type
declare global {
  interface Window {
    PhotoSphereViewer: any;
  }
}

export default TourDetail;
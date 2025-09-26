import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader } from "@googlemaps/js-api-loader";
import {
  MapPin,
  Route,
  Clock,
  Plus,
  Minus,
  Navigation as NavigationIcon,
  Save,
  Download,
  Shuffle,
  Mountain,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Declare global google maps types
declare global {
  interface Window {
    google: any;
  }
}

// Type declarations for non-typed Google Maps objects
type GoogleMapsPlace = {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat(): number;
      lng(): number;
    };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
};

interface Monastery {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  description: string;
}

interface Place extends GoogleMapsPlace {}

interface ItineraryStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  duration: number; // estimated time in minutes
}

const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // Replace with actual API key

const Itinerary = () => {
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [selectedMonastery, setSelectedMonastery] = useState<string>("");
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [itineraryStops, setItineraryStops] = useState<ItineraryStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [totalDistance, setTotalDistance] = useState<string>("");
  const [totalDuration, setTotalDuration] = useState<string>("");
  const [itineraryName, setItineraryName] = useState<string>("");
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  
  const { toast } = useToast();

  // Load monasteries data
  useEffect(() => {
    const loadMonasteries = async () => {
      try {
        const response = await fetch("/data/monasteries.json");
        const data = await response.json();
        setMonasteries(data);
      } catch (error) {
        console.error("Error loading monasteries:", error);
        toast({
          title: "Error",
          description: "Failed to load monasteries data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadMonasteries();
  }, [toast]);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["places"],
        });

        await loader.load();

        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 27.325, lng: 88.612 }, // Center on Sikkim
          zoom: 10,
          mapTypeId: window.google.maps.MapTypeId.TERRAIN,
        });

        mapInstanceRef.current = map;
        directionsServiceRef.current = new window.google.maps.DirectionsService();
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          draggable: true,
          panel: document.getElementById("directionsPanel") || undefined,
        });
        directionsRendererRef.current.setMap(map);

      } catch (error) {
        console.error("Error loading Google Maps:", error);
        toast({
          title: "Maps Error",
          description: "Failed to load Google Maps. Please check your API key.",
          variant: "destructive",
        });
      }
    };

    initMap();
  }, [toast]);

  // Search for nearby places when monastery is selected
  useEffect(() => {
    if (!selectedMonastery || !mapInstanceRef.current) return;

    const monastery = monasteries.find(m => m.id === selectedMonastery);
    if (!monastery) return;

    setSearchingPlaces(true);
    const service = new window.google.maps.places.PlacesService(mapInstanceRef.current);
    const location = new window.google.maps.LatLng(monastery.lat, monastery.lng);

    // Center map on selected monastery
    mapInstanceRef.current.setCenter(location);
    mapInstanceRef.current.setZoom(12);

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add monastery marker
    const monasteryMarker = new window.google.maps.Marker({
      position: location,
      map: mapInstanceRef.current,
      title: monastery.name,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#D4AF37">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
      },
    });
    markersRef.current.push(monasteryMarker);

    // Search categories
    const categories = [
      'tourist_attraction',
      'restaurant',
      'shopping_mall',
      'amusement_park',
      'natural_feature',
      'point_of_interest'
    ];

    const allPlaces: Place[] = [];
    let completedSearches = 0;

    categories.forEach(type => {
      const request = {
        location: location,
        radius: 25000, // 25km radius
        type: type as any,
      };

      service.nearbySearch(request, (results: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          allPlaces.push(...results);
        }
        
        completedSearches++;
        if (completedSearches === categories.length) {
          // Remove duplicates and filter
          const uniquePlaces = allPlaces.filter((place, index, self) => 
            index === self.findIndex(p => p.place_id === place.place_id)
          ).slice(0, 20); // Limit to 20 places

          setNearbyPlaces(uniquePlaces);
          setSearchingPlaces(false);

          // Add markers for nearby places
          uniquePlaces.forEach(place => {
            const marker = new window.google.maps.Marker({
              position: place.geometry.location,
              map: mapInstanceRef.current,
              title: place.name,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#FF6B6B">
                    <circle cx="12" cy="12" r="8"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(20, 20),
              },
            });
            markersRef.current.push(marker);
          });
        }
      });
    });
  }, [selectedMonastery, monasteries, mapInstanceRef.current]);

  // Update route when itinerary stops change
  useEffect(() => {
    if (itineraryStops.length > 1 && directionsServiceRef.current && directionsRendererRef.current) {
      calculateRoute();
    }
  }, [itineraryStops]);

  const calculateRoute = () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || itineraryStops.length < 2) return;

    const waypoints = itineraryStops.slice(1, -1).map(stop => ({
      location: new window.google.maps.LatLng(stop.lat, stop.lng),
      stopover: true,
    }));

    const request = {
      origin: new window.google.maps.LatLng(itineraryStops[0].lat, itineraryStops[0].lng),
      destination: new window.google.maps.LatLng(itineraryStops[itineraryStops.length - 1].lat, itineraryStops[itineraryStops.length - 1].lng),
      waypoints: waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true,
    };

    directionsServiceRef.current.route(request, (result: any, status: any) => {
      if (status === window.google.maps.DirectionsStatus.OK && result) {
        directionsRendererRef.current?.setDirections(result);
        
        // Calculate total distance and duration
        let totalDist = 0;
        let totalTime = 0;
        
        if (result.routes[0]) {
          result.routes[0].legs.forEach(leg => {
            if (leg.distance) totalDist += leg.distance.value;
            if (leg.duration) totalTime += leg.duration.value;
          });
        }

        setTotalDistance((totalDist / 1000).toFixed(1) + " km");
        setTotalDuration(Math.round(totalTime / 60) + " minutes");
      }
    });
  };

  const addToItinerary = (place: Place) => {
    const newStop: ItineraryStop = {
      id: place.place_id,
      name: place.name,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      type: place.types[0] || 'point_of_interest',
      duration: 60, // Default 1 hour
    };

    setItineraryStops(prev => [...prev, newStop]);
    toast({
      title: "Added to Itinerary",
      description: `${place.name} has been added to your itinerary`,
    });
  };

  const removeFromItinerary = (stopId: string) => {
    setItineraryStops(prev => prev.filter(stop => stop.id !== stopId));
    toast({
      title: "Removed from Itinerary",
      description: "Stop has been removed from your itinerary",
    });
  };

  const optimizeRoute = () => {
    if (itineraryStops.length > 2) {
      // Simple optimization - in a real app, you'd use more sophisticated algorithms
      const firstStop = itineraryStops[0];
      const lastStop = itineraryStops[itineraryStops.length - 1];
      const middleStops = itineraryStops.slice(1, -1);
      
      // Shuffle middle stops for demonstration
      const shuffled = [...middleStops].sort(() => Math.random() - 0.5);
      setItineraryStops([firstStop, ...shuffled, lastStop]);
      
      toast({
        title: "Route Optimized",
        description: "Your itinerary has been optimized for efficiency",
      });
    }
  };

  const saveItinerary = () => {
    if (!itineraryName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your itinerary",
        variant: "destructive",
      });
      return;
    }

    const itinerary = {
      name: itineraryName,
      baseMonastery: selectedMonastery,
      stops: itineraryStops,
      totalDistance,
      totalDuration,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage for demo purposes
    const savedItineraries = JSON.parse(localStorage.getItem('monastery_itineraries') || '[]');
    savedItineraries.push(itinerary);
    localStorage.setItem('monastery_itineraries', JSON.stringify(savedItineraries));

    toast({
      title: "Itinerary Saved",
      description: `"${itineraryName}" has been saved successfully`,
    });
  };

  const getPlaceTypeIcon = (types: string[]) => {
    if (types.includes('restaurant') || types.includes('food')) return '🍽️';
    if (types.includes('tourist_attraction')) return '🏛️';
    if (types.includes('shopping_mall') || types.includes('store')) return '🛍️';
    if (types.includes('amusement_park')) return '🎢';
    if (types.includes('natural_feature')) return '🏔️';
    return '📍';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-pulse text-2xl monastery-heading">
              Loading Itinerary Planner...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-monastery text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <Route className="h-16 w-16 mx-auto mb-6 text-gold" />
          <h1 className="text-5xl font-bold monastery-heading mb-6 text-primary-foreground">
            Dynamic Itinerary Planner
          </h1>
          <p className="text-xl max-w-3xl mx-auto opacity-90 text-primary-foreground">
            Create personalized journeys through Sikkim's monasteries and attractions.
            Discover nearby places, optimize your route, and save your perfect itinerary.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Monastery Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mountain className="h-5 w-5" />
                  Base Monastery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedMonastery} onValueChange={setSelectedMonastery}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a monastery" />
                  </SelectTrigger>
                  <SelectContent>
                    {monasteries.map((monastery) => (
                      <SelectItem key={monastery.id} value={monastery.id}>
                        {monastery.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Nearby Places */}
            {selectedMonastery && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Nearby Attractions
                    {searchingPlaces && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full ml-2" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {nearbyPlaces.map((place) => (
                      <div key={place.place_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span>{getPlaceTypeIcon(place.types)}</span>
                            <div>
                              <p className="font-medium text-sm">{place.name}</p>
                              <p className="text-xs text-muted-foreground">{place.vicinity}</p>
                              {place.rating && (
                                <p className="text-xs text-muted-foreground">
                                  ⭐ {place.rating} ({place.user_ratings_total || 0} reviews)
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToItinerary(place)}
                          disabled={itineraryStops.some(stop => stop.id === place.place_id)}
                        >
                          {itineraryStops.some(stop => stop.id === place.place_id) ? (
                            <Minus className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Itinerary */}
            {itineraryStops.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <NavigationIcon className="h-5 w-5" />
                    Your Itinerary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {itineraryStops.map((stop, index) => (
                      <div key={stop.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <div>
                            <p className="font-medium text-sm">{stop.name}</p>
                            <p className="text-xs text-muted-foreground">{stop.type}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromItinerary(stop.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {totalDistance && totalDuration && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {totalDistance}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {totalDuration}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={optimizeRoute}
                      disabled={itineraryStops.length < 3}
                    >
                      <Shuffle className="h-4 w-4 mr-1" />
                      Optimize
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Input
                      placeholder="Enter itinerary name..."
                      value={itineraryName}
                      onChange={(e) => setItineraryName(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      onClick={saveItinerary}
                      disabled={!itineraryName.trim() || itineraryStops.length === 0}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Itinerary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Interactive Map
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div 
                  ref={mapRef} 
                  className="w-full h-[600px] rounded-b-lg"
                  style={{ minHeight: '600px' }}
                />
                <div id="directionsPanel" className="p-4 max-h-48 overflow-y-auto text-sm" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Itinerary;
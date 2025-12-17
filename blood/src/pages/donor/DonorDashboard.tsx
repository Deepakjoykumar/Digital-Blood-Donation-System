import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Droplets, Search, MapPin, Heart, LogOut, User, Building2, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Hospital = Database["public"]["Tables"]["hospitals"]["Row"];
type BloodStock = Database["public"]["Tables"]["blood_stock"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const DonorDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, profileId, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hospitals, setHospitals] = useState<(Hospital & { blood_stock: BloodStock[] })[]>([]);
  const [searchCity, setSearchCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/donor");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchHospitals();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    if (data) setProfile(data);
  };

  const fetchHospitals = async () => {
    setLoading(true);
    let query = supabase
      .from("hospitals")
      .select("*, blood_stock(*)");

    if (searchCity) {
      query = query.ilike("city", `%${searchCity}%`);
    }

    const { data, error } = await query;
    if (data) setHospitals(data as any);
    setLoading(false);
  };

  const handleWillingToDonate = async () => {
    if (!profile || !profile.blood_group) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile with blood group",
        variant: "destructive",
      });
      return;
    }

    setDonating(true);
    try {
      const { error } = await supabase.from("donation_notifications").insert({
        donor_id: profile.id,
        donor_name: profile.full_name,
        blood_group: profile.blood_group,
        city: profile.city || "",
        address: profile.address,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Notification Sent!",
        description: "All hospitals have been notified of your willingness to donate",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDonating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center">
              <Droplets className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">BloodConnect</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/donor/profile">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome, {profile?.full_name || "Donor"}!
          </h1>
          <p className="text-muted-foreground">
            Your blood group: <span className="font-semibold text-primary">{profile?.blood_group || "Not set"}</span>
          </p>
        </div>

        {/* Willing to Donate CTA */}
        <Card variant="gradient" className="mb-8 overflow-hidden">
          <div className="gradient-hero p-8 text-primary-foreground">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="font-display text-2xl font-bold mb-2">Ready to Save Lives?</h2>
                <p className="opacity-90">
                  Click the button to notify all hospitals that you're willing to donate blood
                </p>
              </div>
              <Button
                variant="secondary"
                size="xl"
                onClick={handleWillingToDonate}
                disabled={donating}
                className="shrink-0"
              >
                {donating ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Heart className="w-5 h-5 mr-2" />
                )}
                I'm Willing to Donate
              </Button>
            </div>
          </div>
        </Card>

        {/* Search Hospitals */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold mb-4">Find Hospitals</h2>
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchHospitals}>Search</Button>
          </div>
        </div>

        {/* Hospitals List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : hospitals.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No hospitals found. Try a different search.
            </div>
          ) : (
            hospitals.map((hospital) => (
              <Card key={hospital.id} variant="interactive">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{hospital.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {hospital.city}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{hospital.address}</p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Blood Stock:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {hospital.blood_stock?.map((stock) => (
                        <div
                          key={stock.id}
                          className={`text-center p-2 rounded-lg ${
                            stock.units_available > 5
                              ? "bg-success/10 text-success"
                              : stock.units_available > 0
                              ? "bg-warning/10 text-warning"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          <div className="text-xs font-medium">{stock.blood_group}</div>
                          <div className="text-lg font-bold">{stock.units_available}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default DonorDashboard;

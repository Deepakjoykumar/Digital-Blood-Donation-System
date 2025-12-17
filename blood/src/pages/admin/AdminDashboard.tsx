import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Droplets, LogOut, Building2, Users, Trash2, Loader2, MapPin, Phone, Mail } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";

type Hospital = Database["public"]["Tables"]["hospitals"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [donors, setDonors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Check if admin is logged in
    const isAdmin = sessionStorage.getItem("adminAuth");
    if (!isAdmin) {
      navigate("/admin/login");
      return;
    }
    
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch hospitals
    const { data: hospitalData } = await supabase
      .from("hospitals")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (hospitalData) setHospitals(hospitalData);

    // Fetch donors (profiles with role = donor)
    const { data: donorData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "donor")
      .order("created_at", { ascending: false });
    
    if (donorData) setDonors(donorData);
    
    setLoading(false);
  };

  const deleteHospital = async (hospitalId: string) => {
    setDeletingId(hospitalId);
    try {
      // Delete associated blood stock first
      await supabase
        .from("blood_stock")
        .delete()
        .eq("hospital_id", hospitalId);

      // Delete associated donation history
      await supabase
        .from("donation_history")
        .delete()
        .eq("hospital_id", hospitalId);

      // Update donation notifications to remove responded_by reference
      await supabase
        .from("donation_notifications")
        .update({ responded_by: null, status: "pending" })
        .eq("responded_by", hospitalId);

      // Delete the hospital
      const { error } = await supabase
        .from("hospitals")
        .delete()
        .eq("id", hospitalId);

      if (error) throw error;

      toast({
        title: "Hospital Deleted",
        description: "Hospital and all related data have been removed",
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const deleteDonor = async (donorId: string) => {
    setDeletingId(donorId);
    try {
      // Delete associated donation notifications
      await supabase
        .from("donation_notifications")
        .delete()
        .eq("donor_id", donorId);

      // Delete associated donation history
      await supabase
        .from("donation_history")
        .delete()
        .eq("donor_id", donorId);

      // Delete the profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", donorId);

      if (error) throw error;

      toast({
        title: "Donor Deleted",
        description: "Donor and all related data have been removed",
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    navigate("/");
  };

  if (loading) {
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
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Droplets className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">BloodConnect</span>
            <Badge variant="secondary" className="ml-2">Admin</Badge>
          </Link>
          
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Hospitals Section */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Hospitals
                <Badge variant="outline" className="ml-auto">{hospitals.length}</Badge>
              </CardTitle>
              <CardDescription>Manage registered hospitals</CardDescription>
            </CardHeader>
            <CardContent>
              {hospitals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hospitals registered
                </p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {hospitals.map((hospital) => (
                    <div
                      key={hospital.id}
                      className="p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium">{hospital.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {hospital.hospital_id}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {hospital.city}
                            </span>
                            {hospital.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {hospital.phone}
                              </span>
                            )}
                            {hospital.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {hospital.email}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {hospital.address}
                          </p>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              disabled={deletingId === hospital.id}
                            >
                              {deletingId === hospital.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Hospital?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {hospital.name} and all related data including blood stock and donation records. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteHospital(hospital.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Donors Section */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Donors
                <Badge variant="outline" className="ml-auto">{donors.length}</Badge>
              </CardTitle>
              <CardDescription>Manage registered donors</CardDescription>
            </CardHeader>
            <CardContent>
              {donors.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No donors registered
                </p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {donors.map((donor) => (
                    <div
                      key={donor.id}
                      className="p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{donor.full_name}</h3>
                            {donor.blood_group && (
                              <Badge variant="default">{donor.blood_group}</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                            {donor.age && (
                              <span>Age: {donor.age}</span>
                            )}
                            {donor.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {donor.city}
                              </span>
                            )}
                            {donor.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {donor.phone}
                              </span>
                            )}
                          </div>
                          {donor.address && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {donor.address}
                            </p>
                          )}
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              disabled={deletingId === donor.id}
                            >
                              {deletingId === donor.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Donor?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {donor.full_name} and all related data including donation history. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteDonor(donor.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

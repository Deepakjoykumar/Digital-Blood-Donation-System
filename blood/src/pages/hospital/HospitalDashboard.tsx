import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Droplets, LogOut, Bell, Package, Users, Check, X, Loader2, MapPin, Phone, Trash2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Hospital = Database["public"]["Tables"]["hospitals"]["Row"];
type BloodStock = Database["public"]["Tables"]["blood_stock"]["Row"];
type DonationNotification = Database["public"]["Tables"]["donation_notifications"]["Row"];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, hospitalId, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [bloodStock, setBloodStock] = useState<BloodStock[]>([]);
  const [notifications, setNotifications] = useState<DonationNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockValues, setStockValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/hospital");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchHospitalData();
      subscribeToNotifications();
    }
  }, [user]);

  const fetchHospitalData = async () => {
    setLoading(true);
    
    const { data: hospitalData } = await supabase
      .from("hospitals")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    if (hospitalData) {
      setHospital(hospitalData);
      
      const { data: stockData } = await supabase
        .from("blood_stock")
        .select("*")
        .eq("hospital_id", hospitalData.id);

      if (stockData) {
        setBloodStock(stockData);
        const values: Record<string, string> = {};
        stockData.forEach((s) => {
          values[s.blood_group] = s.units_available.toString();
        });
        setStockValues(values);
      }

      // Fetch notifications
      const { data: notifData } = await supabase
        .from("donation_notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (notifData) setNotifications(notifData);
    }

    setLoading(false);
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "donation_notifications",
        },
        (payload) => {
          const newNotification = payload.new as DonationNotification;
          setNotifications((prev) => [newNotification, ...prev]);
          toast({
            title: "New Donor Available!",
            description: `${newNotification.donor_name} (${newNotification.blood_group}) wants to donate`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateStock = async (bloodGroup: string, units: number) => {
    if (!hospital) return;

    const existingStock = bloodStock.find((s) => s.blood_group === bloodGroup);

    try {
      if (existingStock) {
        await supabase
          .from("blood_stock")
          .update({ units_available: units })
          .eq("id", existingStock.id);
      } else {
        await supabase.from("blood_stock").insert({
          hospital_id: hospital.id,
          blood_group: bloodGroup as typeof BLOOD_GROUPS[number],
          units_available: units,
        });
      }

      toast({ title: "Stock Updated", description: `${bloodGroup} stock updated to ${units} units` });
      fetchHospitalData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const respondToNotification = async (notificationId: string, status: "approved" | "rejected") => {
    if (!hospital) return;

    try {
      const { error } = await supabase
        .from("donation_notifications")
        .update({ 
          status, 
          responded_by: hospital.id 
        })
        .eq("id", notificationId);

      if (error) throw error;

      if (status === "approved") {
        const notification = notifications.find((n) => n.id === notificationId);
        if (notification) {
          await supabase.from("donation_history").insert({
            donor_id: notification.donor_id,
            hospital_id: hospital.id,
            blood_group: notification.blood_group,
            donation_date: new Date().toISOString(),
          });
        }
      }

      toast({
        title: status === "approved" ? "Donation Approved" : "Request Declined",
        description: status === "approved" 
          ? "Donor has been notified and added to records" 
          : "Request has been declined",
      });

      fetchHospitalData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const clearNotificationHistory = () => {
    if (!hospital) return;

    // Filter out responded notifications (not pending ones)
    const respondedNotifications = notifications.filter(
      (n) => n.status !== "pending"
    );

    if (respondedNotifications.length === 0) {
      toast({
        title: "No History to Clear",
        description: "There are no responded notifications to clear",
      });
      return;
    }

    // Remove from local state - keep only pending notifications
    setNotifications((prev) => prev.filter((n) => n.status === "pending"));

    toast({
      title: "History Cleared",
      description: "Responded notifications have been cleared from view",
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-success" />
      </div>
    );
  }

  const pendingNotifications = notifications.filter((n) => n.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center">
              <Droplets className="w-6 h-6 text-success-foreground" />
            </div>
            <span className="font-display text-xl font-bold">BloodConnect</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {pendingNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {pendingNotifications.length}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hospital Info */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">{hospital?.name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {hospital?.city}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              {hospital?.phone}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Blood Stock Management */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Blood Stock Management
              </CardTitle>
              <CardDescription>Update available blood units</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {BLOOD_GROUPS.map((bg) => {
                  const stock = bloodStock.find((s) => s.blood_group === bg);
                  return (
                    <div key={bg} className="space-y-2">
                      <Label>{bg}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={stockValues[bg] || "0"}
                          onChange={(e) => setStockValues({ ...stockValues, [bg]: e.target.value })}
                          className="w-20"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStock(bg, parseInt(stockValues[bg] || "0"))}
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Donor Notifications */}
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Donor Notifications
                  {pendingNotifications.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pendingNotifications.length} new
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearNotificationHistory}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear History
                </Button>
              </div>
              <CardDescription>Donors willing to donate blood</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No notifications yet
                </p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.status === "pending"
                          ? "bg-accent/50 border-primary/20"
                          : "bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{notification.donor_name}</span>
                            <Badge variant={notification.status === "pending" ? "default" : "secondary"}>
                              {notification.blood_group}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {notification.city}
                            {notification.address && ` • ${notification.address}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        {notification.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button
                              variant="success"
                              size="icon"
                              onClick={() => respondToNotification(notification.id, "approved")}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => respondToNotification(notification.id, "rejected")}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Badge
                            variant={notification.status === "approved" ? "default" : "secondary"}
                            className={notification.status === "approved" ? "bg-success" : ""}
                          >
                            {notification.responded_by === hospital?.id 
                              ? notification.status 
                              : `${notification.status} (by other)`}
                          </Badge>
                        )}
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

export default HospitalDashboard;

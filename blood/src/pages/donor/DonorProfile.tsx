import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Droplets, ArrowLeft, Loader2, Save, FileText, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type DonationHistory = Database["public"]["Tables"]["donation_history"]["Row"] & {
  hospitals: { name: string } | null;
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

const DonorProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [donationHistory, setDonationHistory] = useState<DonationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    blood_group: "",
    city: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/donor");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchDonationHistory();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    if (data) {
      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        age: data.age?.toString() || "",
        blood_group: data.blood_group || "",
        city: data.city || "",
        address: data.address || "",
        phone: data.phone || "",
      });
    }
    setLoading(false);
  };

  const fetchDonationHistory = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user!.id)
      .single();

    if (profileData) {
      const { data } = await supabase
        .from("donation_history")
        .select("*, hospitals(name)")
        .eq("donor_id", profileData.id)
        .order("donation_date", { ascending: false });

      if (data) setDonationHistory(data as any);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          age: parseInt(formData.age),
          blood_group: formData.blood_group as typeof BLOOD_GROUPS[number],
          city: formData.city,
          address: formData.address,
          phone: formData.phone,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({ title: "Profile Updated", description: "Your changes have been saved" });
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const generateCertificate = (donation: DonationHistory) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Deep crimson/burgundy background
    doc.setFillColor(89, 12, 24);
    doc.rect(0, 0, width, height, 'F');

    // Decorative gold diagonal stripes (top-left)
    doc.setFillColor(212, 175, 55);
    doc.triangle(0, height * 0.4, width * 0.55, 0, 0, 0, 'F');
    
    doc.setFillColor(139, 90, 43);
    doc.triangle(0, height * 0.5, width * 0.45, 0, 0, 0, 'F');

    // Bottom gold bar
    doc.setFillColor(212, 175, 55);
    doc.rect(0, height - 30, width, 30, 'F');
    
    // Gold border frame
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(3);
    doc.rect(8, 8, width - 16, height - 16, 'S');
    
    doc.setLineWidth(1);
    doc.rect(12, 12, width - 24, height - 24, 'S');

    // Logo area - Blood drop icon
    doc.setFillColor(200, 30, 30);
    doc.circle(28, 28, 10, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(28, 26, 4, 'F');
    
    // Logo text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("BLOOD", 45, 25);
    doc.text("CONNECT", 45, 31);

    // "CERTIFICATE" header (right side)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor(212, 175, 55);
    doc.text("C E R T I F I C A T E", width - 80, 30, { align: "center" });

    // "BLOOD DONATION" title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(200, 30, 30);
    doc.text("BLOOD", width / 2 - 30, 55, { align: "center" });
    doc.setTextColor(212, 175, 55);
    doc.text("DONATION", width / 2 + 40, 55, { align: "center" });

    // Gold medal/seal badge (left side)
    doc.setFillColor(139, 90, 43);
    doc.circle(45, height / 2, 20, 'F');
    doc.setFillColor(212, 175, 55);
    doc.circle(45, height / 2, 16, 'F');
    doc.setFillColor(200, 30, 30);
    doc.circle(45, height / 2, 11, 'F');
    // Blood drop in seal
    doc.setFillColor(255, 255, 255);
    doc.circle(45, height / 2 - 3, 4, 'F');
    // Ribbon effect
    doc.setFillColor(212, 175, 55);
    doc.rect(35, height / 2 + 18, 8, 15, 'F');
    doc.rect(47, height / 2 + 18, 8, 15, 'F');

    // Decorative line under title
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.8);
    doc.line(width / 2 - 90, 62, width / 2 + 90, 62);

    // Donor name (script-like style)
    doc.setFont("times", "bolditalic");
    doc.setFontSize(38);
    doc.setTextColor(255, 255, 255);
    doc.text(profile?.full_name || "Donor Name", width / 2, 85, { align: "center" });

    // Certificate description text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(212, 175, 55);
    doc.text("THIS CERTIFIES THAT THE ABOVE NAMED INDIVIDUAL", width / 2, 100, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    const descText = `has voluntarily donated blood at ${donation.hospitals?.name || "BloodConnect Partner Hospital"} and contributed to saving lives. We express our sincere gratitude for this noble and selfless act of kindness that helps those in need.`;
    const textLines = doc.splitTextToSize(descText, width - 100);
    doc.text(textLines, width / 2, 112, { align: "center" });

    // Blood group badge
    doc.setFillColor(212, 175, 55);
    doc.roundedRect(width / 2 - 25, 130, 50, 18, 3, 3, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(89, 12, 24);
    doc.text(`Blood Group: ${donation.blood_group}`, width / 2, 142, { align: "center" });

    // Bottom section - Date and Signature on gold bar
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(89, 12, 24);
    
    // Date section
    doc.text("DATE", 60, height - 20, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(new Date(donation.donation_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), 60, height - 13, { align: "center" });

    // Signature section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("SIGNATURE", width - 60, height - 20, { align: "center" });
    doc.setFont("times", "italic");
    doc.setFontSize(12);
    doc.text("BloodConnect Authority", width - 60, height - 12, { align: "center" });

    // Download PDF directly with filename
    const fileName = `BloodDonation_Certificate_${profile?.full_name?.replace(/\s+/g, '_') || 'Donor'}_${new Date(donation.donation_date).toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    toast({ title: "Certificate Downloaded", description: "Your donation certificate PDF has been downloaded" });
  };

  if (authLoading || loading) {
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/donor/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select
                  value={formData.blood_group}
                  onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Donation History */}
        <Card variant="elevated" className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Donation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {donationHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No donation history yet
              </p>
            ) : (
              <div className="space-y-4">
                {donationHistory.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{donation.hospitals?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(donation.donation_date).toLocaleDateString()} • {donation.blood_group}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateCertificate(donation)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Certificate
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DonorProfile;

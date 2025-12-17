import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, ArrowLeft, Loader2 } from "lucide-react";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  hospitalId: z.string().min(3, "Hospital ID is required"),
  name: z.string().min(2, "Hospital name is required"),
  city: z.string().min(2, "City is required"),
  address: z.string().min(5, "Address is required"),
  phone: z.string().min(10, "Valid phone number required"),
});

const HospitalAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    hospitalId: "",
    name: "",
    city: "",
    address: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({ title: "Welcome back!", description: "Login successful" });
        navigate("/hospital/dashboard");
      } else {
        const validation = signUpSchema.safeParse(formData);

        if (!validation.success) {
          const errors = validation.error.errors.map(e => e.message).join(", ");
          throw new Error(errors);
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: hospitalError } = await supabase.from("hospitals").insert({
            user_id: authData.user.id,
            hospital_id: formData.hospitalId,
            name: formData.name,
            city: formData.city,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
          });

          if (hospitalError) {
            if (hospitalError.message.includes("duplicate")) {
              throw new Error("Hospital ID already exists");
            }
            throw hospitalError;
          }
        }

        toast({ title: "Hospital registered!", description: "Welcome to BloodConnect" });
        navigate("/hospital/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-20 left-10 w-72 h-72 bg-success/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-success/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card variant="elevated">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-success rounded-xl flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-success-foreground" />
            </div>
            <CardTitle className="text-2xl">{isLogin ? "Hospital Login" : "Hospital Registration"}</CardTitle>
            <CardDescription>
              {isLogin ? "Access your hospital dashboard" : "Register your hospital"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Hospital Name</Label>
                    <Input
                      id="name"
                      placeholder="City General Hospital"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hospitalId">Hospital ID</Label>
                    <Input
                      id="hospitalId"
                      placeholder="HOSP-001"
                      value={formData.hospitalId}
                      onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Medical Center Drive"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+1 234 567 890"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hospital@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" variant="success" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isLogin ? "Sign In" : "Register Hospital"}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {isLogin ? "New hospital? " : "Already registered? "}
                </span>
                <button
                  type="button"
                  className="text-success hover:underline font-medium"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Register" : "Sign In"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HospitalAuth;

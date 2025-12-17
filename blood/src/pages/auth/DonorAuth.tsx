import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Droplets, ArrowLeft, Loader2, Upload, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(18, "Must be at least 18 years old").max(65, "Must be 65 or younger"),
  bloodGroup: z.enum(BLOOD_GROUPS, { required_error: "Please select a blood group" }),
  city: z.string().min(2, "City is required"),
  address: z.string().min(5, "Address is required"),
  phone: z.string().min(10, "Valid phone number required"),
});

const DonorAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    age: "",
    bloodGroup: "",
    city: "",
    address: "",
    phone: "",
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please select an image under 2MB", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

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
        navigate("/donor/dashboard");
      } else {
        const validation = signUpSchema.safeParse({
          ...formData,
          age: parseInt(formData.age),
        });

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
          let avatarUrl = null;

          // Upload avatar if provided
          if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${authData.user.id}/avatar.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, avatarFile, { upsert: true });

            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
              avatarUrl = urlData.publicUrl;
            }
          }

          const { error: profileError } = await supabase.from("profiles").insert({
            user_id: authData.user.id,
            full_name: formData.fullName,
            age: parseInt(formData.age),
            blood_group: formData.bloodGroup as typeof BLOOD_GROUPS[number],
            city: formData.city,
            address: formData.address,
            phone: formData.phone,
            role: "donor",
            avatar_url: avatarUrl,
          });

          if (profileError) throw profileError;
        }

        toast({ title: "Account created!", description: "Welcome to BloodConnect" });
        navigate("/donor/dashboard");
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
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card variant="elevated">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 gradient-hero rounded-xl flex items-center justify-center mb-4">
              <Droplets className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">{isLogin ? "Donor Login" : "Donor Registration"}</CardTitle>
            <CardDescription>
              {isLogin ? "Welcome back! Sign in to continue" : "Create your donor account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  {/* Photo Upload */}
                  <div className="flex flex-col items-center gap-3">
                    <Label>Profile Photo</Label>
                    <div 
                      className="relative cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Avatar className="w-24 h-24 border-2 border-dashed border-primary/50 group-hover:border-primary transition-colors">
                        <AvatarImage src={avatarPreview || undefined} />
                        <AvatarFallback className="bg-muted">
                          <User className="w-10 h-10 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <span className="text-xs text-muted-foreground">Click to upload (max 2MB)</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="25"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bloodGroup">Blood Group</Label>
                      <Select
                        value={formData.bloodGroup}
                        onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_GROUPS.map((bg) => (
                            <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                      placeholder="123 Main Street"
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
                  placeholder="your@email.com"
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

              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isLogin ? "Sign In" : "Create Account"}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
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

export default DonorAuth;

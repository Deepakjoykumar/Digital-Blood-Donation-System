import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "donor" | "hospital" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  profileId: string | null;
  hospitalId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  profileId: null,
  hospitalId: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setProfileId(null);
          setHospitalId(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Check if user is a donor
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile) {
        setRole("donor");
        setProfileId(profile.id);
        setHospitalId(null);
        setLoading(false);
        return;
      }

      // Check if user is a hospital
      const { data: hospital } = await supabase
        .from("hospitals")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (hospital) {
        setRole("hospital");
        setHospitalId(hospital.id);
        setProfileId(null);
        setLoading(false);
        return;
      }

      setRole(null);
      setProfileId(null);
      setHospitalId(null);
    } catch (error) {
      console.error("Error fetching user role:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfileId(null);
    setHospitalId(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, profileId, hospitalId, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

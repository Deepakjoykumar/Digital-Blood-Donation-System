import { Heart, Droplets, Users, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageTransition from "@/components/PageTransition";
import AnimatedBackground from "@/components/AnimatedBackground";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const Index = () => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <header className="relative overflow-hidden">
          <AnimatedBackground />
          
          <motion.nav 
            className="relative z-10 container mx-auto px-4 py-6 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div 
                className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center"
                whileHover={{ rotate: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Droplets className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <span className="font-display text-xl font-bold">BloodConnect</span>
            </motion.div>
            <div className="flex items-center gap-4">
              <Link to="/auth/donor">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost">Donor Login</Button>
                </motion.div>
              </Link>
              <Link to="/auth/hospital">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline-primary">Hospital Login</Button>
                </motion.div>
              </Link>
              <Link to="/admin/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">Admin Portal</Button>
                </motion.div>
              </Link>
            </div>
          </motion.nav>

          <div className="relative z-10 container mx-auto px-4 py-20 md:py-32">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              initial="initial"
              animate="animate"
              variants={stagger}
            >
              <motion.div 
                className="inline-flex items-center gap-2 bg-accent px-4 py-2 rounded-full text-sm font-medium text-accent-foreground mb-6"
                variants={fadeInUp}
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Heart className="w-4 h-4 text-primary" />
                </motion.div>
                <span>Save Lives, Donate Blood</span>
              </motion.div>
              
              <motion.h1 
                className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
                variants={fadeInUp}
              >
                Every Drop <motion.span 
                  className="text-primary inline-block"
                  animate={{ 
                    textShadow: [
                      "0 0 0px hsl(var(--primary) / 0)",
                      "0 0 20px hsl(var(--primary) / 0.5)",
                      "0 0 0px hsl(var(--primary) / 0)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >Counts</motion.span>
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
                variants={fadeInUp}
              >
                Connect donors with hospitals in real-time. Join our mission to ensure no one dies due to blood shortage.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                variants={fadeInUp}
              >
                <Link to="/auth/donor">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Button variant="hero" size="xl" className="w-full sm:w-auto shadow-glow">
                      <Users className="w-5 h-5 mr-2" />
                      Register as Donor
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/auth/hospital">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Button variant="outline-primary" size="xl" className="w-full sm:w-auto">
                      <Building2 className="w-5 h-5 mr-2" />
                      Hospital Portal
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </header>

        {/* Features Section */}
        <section className="py-20 bg-muted/30 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-30"
            initial={{ backgroundPosition: "0% 0%" }}
            animate={{ backgroundPosition: "100% 100%" }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
            style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%)",
            }}
          />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                A seamless platform connecting blood donors with hospitals in need
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  whileHover={{ y: -8, boxShadow: "0 20px 40px -10px hsl(var(--primary) / 0.2)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card variant="elevated" className="group h-full">
                    <CardHeader>
                      <motion.div 
                        className="w-14 h-14 gradient-hero rounded-2xl flex items-center justify-center mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Users className="w-7 h-7 text-primary-foreground" />
                      </motion.div>
                      <CardTitle>For Donors</CardTitle>
                      <CardDescription>Register and save lives</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-muted-foreground">
                        {[
                          "Create your donor profile",
                          "Find nearby hospitals",
                          "Express willingness to donate",
                          "Get donation certificates"
                        ].map((item, i) => (
                          <motion.li 
                            key={i}
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <motion.div 
                              className="w-1.5 h-1.5 rounded-full bg-primary"
                              whileHover={{ scale: 1.5 }}
                            />
                            {item}
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <motion.div
                  whileHover={{ y: -8, boxShadow: "0 20px 40px -10px hsl(142 76% 36% / 0.2)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card variant="elevated" className="group h-full">
                    <CardHeader>
                      <motion.div 
                        className="w-14 h-14 bg-success rounded-2xl flex items-center justify-center mb-4"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Building2 className="w-7 h-7 text-success-foreground" />
                      </motion.div>
                      <CardTitle>For Hospitals</CardTitle>
                      <CardDescription>Manage blood inventory efficiently</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-muted-foreground">
                        {[
                          "Register your hospital",
                          "Manage blood stock levels",
                          "Receive donor notifications",
                          "Approve donations & maintain records"
                        ].map((item, i) => (
                          <motion.li 
                            key={i}
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <motion.div 
                              className="w-1.5 h-1.5 rounded-full bg-success"
                              whileHover={{ scale: 1.5 }}
                            />
                            {item}
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { label: "Lives Saved", value: "1000+" },
                { label: "Active Donors", value: "500+" },
                { label: "Partner Hospitals", value: "50+" },
                { label: "Blood Groups", value: "8" },
              ].map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <motion.div 
                      className="font-display text-3xl md:text-4xl font-bold text-primary mb-2"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <motion.footer 
          className="border-t py-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <motion.div 
              className="flex items-center justify-center gap-2 mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div 
                className="w-8 h-8 gradient-hero rounded-lg flex items-center justify-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Droplets className="w-4 h-4 text-primary-foreground" />
              </motion.div>
              <span className="font-display font-bold">BloodConnect</span>
            </motion.div>
            <p className="text-sm">
              © 2024 BloodConnect. Saving lives, one donation at a time.
            </p>
          </div>
        </motion.footer>
      </div>
    </PageTransition>
  );
};

export default Index;

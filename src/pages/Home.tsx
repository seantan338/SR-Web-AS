import { motion } from 'motion/react';
import { 
  ArrowRight, Search, Zap, Globe, Heart, Sparkles, 
  Briefcase, Users, Trophy, ShieldCheck, Building2, 
  UserCheck, Layers, Headphones, Mail, Phone, MapPin,
  CheckCircle2, Sun
} from 'lucide-react';
import { Link } from 'react-router-dom';


export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="pt-16 min-h-screen bg-transparent">
{/* Hero Section */}
      <section
        className="relative overflow-hidden bg-transparent py-24 lg:py-32"
        style={{
          backgroundImage: "url('/bg-image.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gray-900/70"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.2),transparent_50%)]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-2 bg-orange-500/10 text-orange-500 px-4 py-2 rounded-full text-sm font-bold mb-8 border border-orange-500/20">
                <Sparkles className="w-4 h-4" />
                <span>Licensed in Singapore & Malaysia</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-8">
                Connecting Business to <span className="text-orange-500">Optimized Talents</span>
              </h1>
              <p className="text-xl text-slate-300 mb-10 leading-relaxed">
                Smart, relationship-driven recruitment solutions across Malaysia and Singapore. 
                Whether you are an employer building a winning team or a professional seeking your next opportunity, 
                we bring transparency, compliance, and a human touch to every connection.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                <Link to="/contact?role=employer" className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center group">
                  Hire Talent
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/jobs" className="bg-white/10 text-white border border-white/20 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center">
                  Find Your Next Role
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

        {/* Introduction Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-4">Who We Are</h2>
              <h3 className="text-4xl font-bold text-slate-900 mb-8 leading-tight">
                Boutique Size, <br />Big Picture Solutions
              </h3>
              <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                <p>
                  Welcome to Sunrise Recruit. We are a professional, dynamic, and fully licensed recruitment firm serving diverse industries across the MY-SG corridor.
                </p>
                <p>
                  While we are boutique in size, we punch far above our weight by providing tailored, "big picture" HR solutions rather than cookie-cutter services.
                </p>
                <div className="p-8 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
                  <h4 className="text-2xl font-bold mb-4 relative z-10">Our "3-Win Policy"</h4>
                  <p className="text-slate-300 relative z-10">
                    We are driven by creating an all-win situation for our <span className="text-orange-400 font-bold">Clients</span>, our <span className="text-orange-400 font-bold">Candidates</span>, and our <span className="text-orange-400 font-bold">Colleagues</span>.
                  </p>
                  <Trophy className="absolute -right-8 -bottom-8 w-32 h-32 text-white/5 rotate-12" />
                </div>
              </div>
            </motion.div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-xl">
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" alt="Professional" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="aspect-square rounded-3xl overflow-hidden shadow-xl">
                  <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=400" alt="Meeting" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
              <div className="space-y-6 pt-12">
                <div className="aspect-square rounded-3xl overflow-hidden shadow-xl">
                  <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=400" alt="Collaboration" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-xl">
                  <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400" alt="Success" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-4">Our Core Services</h2>
            <h3 className="text-4xl font-bold text-slate-900 mb-6">Comprehensive Hiring Solutions Built for Your Business</h3>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              We offer flexible recruitment models to support your organizational growth, replacement, and urgent hiring needs.
            </p>
          </div>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { 
                icon: Building2, 
                title: 'Permanent Recruitment', 
                desc: 'Long-term hiring solutions designed for organizational growth and business continuity.' 
              },
              { 
                icon: Users, 
                title: 'Contract Staffing', 
                desc: 'Flexible, project-based staffing solutions designed for dynamic workforce needs.' 
              },
              { 
                icon: Search, 
                title: 'Executive Search', 
                desc: 'Discreet, consultative search for senior leadership and specialized talent.' 
              },
              { 
                icon: Layers, 
                title: 'Mass Hiring', 
                desc: 'Structured, large-scale recruitment solutions for high-volume needs.' 
              },
              { 
                icon: Headphones, 
                title: 'HR Consulting & Outsourcing', 
                desc: 'Practical advisory and support extending beyond just recruitment.' 
              }
            ].map((service, idx) => (
              <motion.div 
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
              >
                <div className="w-14 h-14 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <service.icon className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-4">{service.title}</h4>
                <p className="text-slate-600 leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4U Ecosystem Section */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-24 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center space-x-2 text-orange-500 font-bold mb-6">
                  <Zap className="w-5 h-5" />
                  <span>The 4U Ecosystem</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">
                  Powered by 4U: <br />Hiring Made Smarter
                </h2>
                <div className="space-y-6 text-slate-300 text-lg leading-relaxed">
                  <p>
                    Experience recruitment that combines human expertise with intelligent technology. 
                    <span className="text-white font-bold"> 4U (Connecting People for You)</span> is our proprietary digital recruitment infrastructure.
                  </p>
                  <p>
                    Traditional recruitment can feel fragmented and transactional. 4U is a human-centric ecosystem designed to bring transparency, engagement, and trust back into the process.
                  </p>
                  <p>
                    By combining AI-powered matching with expert recruiter screening, we ensure precision without losing the personal touch.
                  </p>
                </div>
              </motion.div>
              <div className="relative">
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                  <div className="space-y-6">
                    {[
                      { title: 'AI-Powered Matching', desc: 'Precision algorithms to find the perfect fit.' },
                      { title: 'Expert Screening', desc: 'Human vetting for cultural and skill alignment.' },
                      { title: 'Transparent Process', desc: 'Real-time updates for clients and candidates.' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold mb-1">{item.title}</h4>
                          <p className="text-slate-400 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-4">Compliance & Expertise</h2>
            <h3 className="text-4xl font-bold text-slate-900 mb-6">Navigating the MY-SG Corridor with Confidence</h3>
            <p className="text-slate-600 max-w-3xl mx-auto text-lg leading-relaxed">
              Cross-border hiring requires rigorous compliance and deep market knowledge. We operate with full regulatory compliance in both countries, ensuring peace of mind for our partners.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-10 rounded-3xl border-2 border-slate-100 bg-slate-50 relative overflow-hidden"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900">Malaysia</h4>
              </div>
              <p className="text-slate-700 font-medium mb-2">Agensi Pekerjaan Sunrise Recruit Sdn Bhd</p>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">License No: JTKSM 170B</p>
              <ShieldCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-200" />
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-10 rounded-3xl border-2 border-slate-100 bg-slate-50 relative overflow-hidden"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Globe className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900">Singapore</h4>
              </div>
              <p className="text-slate-700 font-medium mb-2">Sunrise Recruit Pte. Ltd.</p>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">EA License No: 25C3029</p>
              <ShieldCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-200" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer / Call to Action Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-8">Ready to Discuss Your Needs?</h2>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                Engage with a licensed recruitment partner who understands your needs and delivers professional, compliant talent solutions. 
                There is no obligation—just an opportunity to explore how we can support your growth.
              </p>
              <Link to="/contact" className="inline-flex items-center px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all group">
                Contact Us Today
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 space-y-10">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase text-xs tracking-widest">Singapore Office</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    2, Venture Drive, #24-37, Vision Exchange, <br />Singapore 608526
                  </p>
                  <a href="tel:+6589303903" className="text-orange-500 font-bold text-sm mt-2 block hover:underline">+65 8930 3903</a>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase text-xs tracking-widest">Malaysia Office</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    7B, Jalan Eko Botani 3/5, Taman Eko Botani <br />79100 Iskandar Puteri, Johor, Malaysia
                  </p>
                  <a href="tel:+60167457735" className="text-orange-500 font-bold text-sm mt-2 block hover:underline">+6016 745 7735</a>
                </div>
              </div>

              <div className="flex items-start space-x-6 pt-6 border-t border-slate-100">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase text-xs tracking-widest">Email Us</h4>
                  <a href="mailto:sales@sunriserecruit.com" className="text-slate-600 font-medium hover:text-orange-500 transition-colors">
                    sales@sunriserecruit.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

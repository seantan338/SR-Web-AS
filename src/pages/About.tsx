import { motion } from 'motion/react';
import { 
  Briefcase, Users, Globe, Sparkles, Trophy, Heart, 
  Target, Eye, Handshake, ShieldCheck, Zap, 
  CheckCircle2, Compass, Star, TrendingUp, Sun, Building2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function About() {
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
    <div className="pt-16 min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.1),transparent_50%)]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Connecting Business to Optimized Talents, <span className="text-orange-500">With a Human Touch</span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Welcome to Sunrise Recruit. We are a professional, dynamic, and fully licensed recruitment firm operating across both Singapore and Malaysia.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Intro & Commitment */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-sm font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Boutique Excellence</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Small in Size, Big in Impact</h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                While we are boutique in size, we punch far above our weight by providing highly customized, "big picture" people solutions across diverse industries.
              </p>
              <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                  <Heart className="w-5 h-5 text-orange-500 mr-2" />
                  Our Commitment to Humanity
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Traditional recruitment can often feel transactional, fragmented, and one-sided. At Sunrise Recruit, we are on a mission to change that by putting humanity back at the center of the hiring process. We believe that recruitment works best when it is built on genuine relationships, mutual respect, and transparent communication.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-slate-900">Inclusivity & Diverse Life Paths</h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                We are deeply committed to inclusivity and champion the value of diverse life paths. We understand that not all capable individuals follow uninterrupted, linear careers.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed">
                Whether you have stepped back from full-time employment for parenting, elder care, or other personal commitments, we know that these life experiences build profound resilience and adaptability.
              </p>
              <div className="p-8 bg-orange-50 rounded-3xl border border-orange-100">
                <p className="text-orange-900 font-medium leading-relaxed italic">
                  "At Sunrise Recruit, these experiences do not diminish your capability, judgment, or integrity—they enhance it. In our ecosystem, you are valued for who you are and the thoughtful contribution you can make."
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h3>
              <p className="text-slate-600 leading-relaxed">
                To become the leading employment agency in Malaysia and Singapore by establishing a robust, widespread presence in every state and district, connecting job seekers with employers efficiently and effectively.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-6">
                <Eye className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h3>
              <p className="text-slate-600 leading-relaxed">
                To revolutionize employment services in the region by providing unparalleled support, resources, and opportunities for job seekers and employers, contributing to economic growth and workforce development.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Clients/Candidates/Partners */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Building2 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">For our Clients</h4>
              <p className="text-slate-600">
                We streamline your business flow and help you rise to greater heights by finding the exact right talents. We do not believe in "cookie-cutter" services; we invest the time to truly understand your organization's unique culture.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">For our Candidates</h4>
              <p className="text-slate-600">
                You are not just a profile in a system to us. We strive to fulfill your career aspirations by maximizing your potential through meticulous, caring guidance.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <Handshake className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">For our Colleagues & Partners</h4>
              <p className="text-slate-600">
                We grow together as a team, building strong bonds and creating unlimited opportunities through an engaging and supportive environment.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
            <p className="text-slate-400">Everything we do is guided by our unwavering principles</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {[
              { name: 'Respect for All', icon: Heart, color: 'text-pink-400' },
              { name: 'Positive Mindset & Attitude', icon: Sun, color: 'text-yellow-400' },
              { name: 'Recruit Hard & Recruit Fair', icon: ShieldCheck, color: 'text-blue-400' },
              { name: 'Excellence with Integrity', icon: Star, color: 'text-orange-400' },
              { name: 'Quality & Progress', icon: TrendingUp, color: 'text-green-400' }
            ].map((value, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <value.icon className={cn("w-10 h-10", value.color)} />
                <span className="font-bold text-sm">{value.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 rounded-[3rem] bg-orange-500 text-white shadow-2xl shadow-orange-200 relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Let's build something meaningful together.</h2>
              <p className="text-xl text-orange-50 mb-10 max-w-2xl mx-auto">
                Whether you are an employer looking to build a winning team, or a candidate seeking an opportunity where your voice is truly heard, you will always have our undivided attention.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <button className="px-8 py-4 bg-white text-orange-500 rounded-full font-bold hover:bg-slate-50 transition-all shadow-lg">
                  Get in Touch
                </button>
                <div className="text-sm font-medium text-orange-100">
                  We value relationships, we make your challenges our own.
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>
    </div>
  );
}

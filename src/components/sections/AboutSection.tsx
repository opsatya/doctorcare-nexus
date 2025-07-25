import { motion } from 'framer-motion';
import { Award, Users, Clock, Shield } from 'lucide-react';

const stats = [
  {
    icon: Users,
    number: '500+',
    label: 'Healthcare Professionals',
  },
  {
    icon: Award,
    number: '15+',
    label: 'Years of Experience',
  },
  {
    icon: Clock,
    number: '24/7',
    label: 'Emergency Support',
  },
  {
    icon: Shield,
    number: '100%',
    label: 'Secure & Private',
  },
];

export const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              About DoctorCare
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              We are dedicated to revolutionizing healthcare by making quality medical care 
              accessible to everyone. Our platform connects patients with certified healthcare 
              professionals, ensuring you receive the best care possible.
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              With cutting-edge technology and a compassionate approach, we bridge the gap 
              between patients and doctors, making healthcare more efficient, affordable, 
              and personalized.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">Certified healthcare professionals</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">Secure and private consultations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">Affordable healthcare solutions</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card-service text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
import { motion } from 'framer-motion';
import { CheckCircle, Heart, Brain, Shield, Clock, Users } from 'lucide-react';

const services = [
  {
    icon: Heart,
    title: 'Cardiology',
    description: 'Specialized care for your heart and cardiovascular system.',
  },
  {
    icon: Brain,
    title: 'Mental Wellness',
    description: 'Psychological and psychiatric support for your mental health.',
  },
  {
    icon: Shield,
    title: 'Pediatrics',
    description: 'Specialized medical care for children and adolescents.',
  },
  {
    icon: Clock,
    title: 'Emergency Consultations',
    description: 'Quick care for urgent medical situations.',
  },
  {
    icon: Users,
    title: 'General Medicine',
    description: 'General clinical care for the whole family.',
  },
  {
    icon: CheckCircle,
    title: 'Preventive Exams',
    description: 'Regular check-ups to keep your health on track.',
  },
];

export const ServicesSection = () => {

  return (
    <section id="services" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Our Services
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            We offer a wide range of medical services to care for you and your family
            with the excellence you deserve.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card-service group"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 text-foreground">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-primary font-medium text-lg">
            ✓ In-person and online consultations available
          </p>
        </motion.div>
      </div>
    </section>
  );
};
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Dipti sharma',
    role: 'Working Mother',
    content: 'DoctorCare has been a lifesaver for our family. The convenience of online consultations and the quality of care we receive is exceptional.',
    rating: 5,
    image: '/placeholder.svg',
  },
  {
    name: 'Vedant Dhore',
    role: 'Business Executive',
    content: 'As someone with a busy schedule, having access to quality healthcare anytime is invaluable. The doctors are professional and caring.',
    rating: 5,
    image: '/placeholder.svg',
  },
  {
    name: 'Satya',
    role: 'Student',
    content: 'The mental health support I received through DoctorCare helped me during a difficult time. Highly recommend their services.',
    rating: 5,
    image: '/placeholder.svg',
  },
];

export const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our Patients Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our patients have to say about their experience with DoctorCare.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card-service relative"
            >
              <div className="absolute -top-2 -left-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Quote className="h-4 w-4 text-primary" />
                </div>
              </div>
              
              <div className="pt-4">
                <div className="flex mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
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
            ⭐ 4.9/5 average rating from 2,000+ patients
          </p>
        </motion.div>
      </div>
    </section>
  );
};
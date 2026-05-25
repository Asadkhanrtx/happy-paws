import { Link } from 'react-router-dom';
import { CalendarCheck, ShieldCheck, HeartHandshake, Star, Scissors, Syringe, Stethoscope, Home as HomeIcon } from 'lucide-react';

const STATS = [
  { value: '2,400+', label: 'Happy Pets' },
  { value: '180+',   label: 'Expert Vets' },
  { value: '15,000+', label: 'Appointments' },
  { value: '4.9 ★',  label: 'Avg Rating' },
];

const SERVICES = [
  { icon: Scissors,      title: 'Grooming & Spa',   desc: 'Full bath, haircut, nail trim and blowout by certified groomers.',   link: '/booking', color: 'bg-pink-50   text-pink-600' },
  { icon: Syringe,       title: 'Vaccination',       desc: 'Core and lifestyle vaccines administered by licensed veterinarians.', link: '/booking', color: 'bg-blue-50   text-blue-600' },
  { icon: Stethoscope,   title: 'Health Checkup',    desc: 'Comprehensive wellness exams to keep your pet in peak condition.',    link: '/booking', color: 'bg-green-50  text-green-600' },
  { icon: HomeIcon,      title: 'Shelter Visit',     desc: 'Visit our shelter and meet hundreds of pets ready for adoption.',     link: '/pets',    color: 'bg-amber-50  text-amber-600' },
];

const FEATURED_PETS = [
  { name: 'Bella',   breed: 'Golden Retriever', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=500&q=80' },
  { name: 'Luna',    breed: 'Maine Coon',        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=500&q=80' },
  { name: 'Charlie', breed: 'French Bulldog',    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=500&q=80' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.',   text: 'My golden Bella absolutely loves coming here. The grooming team is exceptional!', rating: 5, avatar: 'S' },
  { name: 'James R.',   text: 'Booked a vaccination appointment in under 2 minutes. Seamless experience.',       rating: 5, avatar: 'J' },
  { name: 'Priya K.',   text: 'Adopted our cat Luna through Happy Paws. The shelter visit was wonderful.',       rating: 5, avatar: 'P' },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Hero ── */}
      <section className="relative bg-burgundy-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="z-10">
              <span className="inline-block bg-burgundy-100 text-primary text-sm font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
                Trusted Pet Care
              </span>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight font-serif mb-6">
                Premium Care for<br />
                <span className="text-primary">Your Best Friend</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
                Book trusted grooming, vaccination, and health checkups — or browse adorable pets waiting to find their forever home.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/booking"
                  className="bg-primary hover:bg-primary-hover text-white font-bold py-4 px-8 rounded-full shadow-lg hover-lift transition text-center">
                  Book Appointment
                </Link>
                <Link to="/pets"
                  className="bg-white text-primary border-2 border-primary hover:bg-burgundy-50 font-bold py-4 px-8 rounded-full shadow hover-lift transition text-center">
                  Meet Our Pets
                </Link>
              </div>
            </div>

            {/* Hero image grid */}
            <div className="relative hidden lg:grid grid-cols-2 gap-4 h-[480px]">
              <div className="rounded-3xl overflow-hidden row-span-2">
                <img src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=500&q=80"
                  alt="Happy dog" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-3xl overflow-hidden">
                <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=500&q=80"
                  alt="Cat" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-3xl overflow-hidden">
                <img src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=500&q=80"
                  alt="Puppy" className="w-full h-full object-cover" />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-burgundy-100 rounded-xl flex items-center justify-center text-2xl">🐾</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">2,400+ Pets</p>
                  <p className="text-xs text-gray-500">cared for monthly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold mb-1">{s.value}</div>
                <div className="text-burgundy-200 text-sm font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 font-serif">Our Services</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Everything your pet needs, all in one place.</p>
            <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((svc, i) => (
              <Link to={svc.link} key={i}
                className="group bg-white border border-gray-100 rounded-3xl p-7 hover-lift shadow-sm hover:shadow-md transition flex flex-col items-start">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${svc.color}`}>
                  <svc.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition">{svc.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{svc.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-20 bg-burgundy-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 font-serif">Why Choose Happy Paws?</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: CalendarCheck,   title: 'Easy Booking',          desc: 'Schedule appointments in seconds with our seamless online booking system.' },
              { icon: ShieldCheck,     title: 'Certified Professionals', desc: 'All specialists are licensed, background-checked, and passionate about animals.' },
              { icon: HeartHandshake,  title: 'Loving Environment',    desc: 'We treat every pet like our own, ensuring a calm, stress-free experience.' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 text-center hover-lift border border-burgundy-100 shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-burgundy-100 text-primary mb-6">
                  <f.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Pets ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-serif">Meet Some Friends</h2>
              <p className="text-gray-500 mt-2">A few pets looking for your love and attention.</p>
            </div>
            <Link to="/pets" className="text-primary font-bold hover:underline text-sm hidden sm:block">
              View all pets →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {FEATURED_PETS.map((pet, i) => (
              <div key={i} className="group rounded-3xl overflow-hidden shadow-md hover-lift border border-gray-100">
                <div className="h-64 overflow-hidden">
                  <img src={pet.image} alt={pet.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="p-5 bg-white">
                  <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
                  <p className="text-primary font-medium text-sm">{pet.breed}</p>
                  <Link to="/pets"
                    className="mt-4 block text-center bg-burgundy-50 hover:bg-primary hover:text-white text-primary font-bold py-2.5 rounded-xl transition duration-300 text-sm">
                    Meet {pet.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-burgundy-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-serif mb-4">What Pet Parents Say</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-3xl p-7 shadow-sm border border-burgundy-100 hover-lift">
                <div className="flex mb-3">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {t.avatar}
                  </div>
                  <span className="font-bold text-gray-900 text-sm">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl lg:text-4xl font-bold font-serif mb-4">Ready to Pamper Your Pet?</h2>
          <p className="text-burgundy-200 mb-8 text-lg">
            Join thousands of happy pet owners who trust Happy Paws for premium care.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/booking"
              className="bg-white text-primary font-bold py-4 px-8 rounded-full hover-lift transition shadow-lg">
              Book Now — It's Free
            </Link>
            <Link to="/shop"
              className="border-2 border-white text-white font-bold py-4 px-8 rounded-full hover:bg-white hover:text-primary transition">
              Browse the Shop
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

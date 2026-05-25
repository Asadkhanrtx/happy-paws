import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Calendar } from 'lucide-react';
import API_BASE from '../api';

const FALLBACK_PETS = [
  { id: 1,  name: 'Bella',   type: 'Dog',    breed: 'Golden Retriever', age: 3, available: true,  description: 'Friendly and energetic, loves fetch and cuddles.',   image_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80' },
  { id: 2,  name: 'Luna',    type: 'Cat',    breed: 'Maine Coon',       age: 2, available: true,  description: 'Fluffy and gentle, perfect lap companion.',           image_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80' },
  { id: 3,  name: 'Charlie', type: 'Dog',    breed: 'French Bulldog',   age: 1, available: true,  description: 'Playful pup with a huge personality.',               image_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80' },
  { id: 4,  name: 'Milo',    type: 'Cat',    breed: 'Scottish Fold',    age: 4, available: true,  description: 'Calm and curious, loves window-watching.',           image_url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80' },
  { id: 5,  name: 'Daisy',   type: 'Dog',    breed: 'Labrador',         age: 2, available: true,  description: 'Super smart and eager to please.',                   image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80' },
  { id: 6,  name: 'Oliver',  type: 'Cat',    breed: 'British Shorthair',age: 3, available: false, description: 'Independent yet affectionate on his terms.',         image_url: 'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?auto=format&fit=crop&w=600&q=80' },
  { id: 7,  name: 'Max',     type: 'Dog',    breed: 'Beagle',           age: 5, available: true,  description: 'Gentle senior dog, ideal for quiet homes.',         image_url: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80' },
  { id: 8,  name: 'Coco',    type: 'Rabbit', breed: 'Holland Lop',      age: 1, available: true,  description: 'Tiny and adorable with floppy ears.',               image_url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=600&q=80' },
  { id: 9,  name: 'Nala',    type: 'Dog',    breed: 'Siberian Husky',   age: 2, available: true,  description: 'Striking blue eyes, loves outdoor adventures.',     image_url: 'https://images.unsplash.com/photo-1568572933382-74d440642117?auto=format&fit=crop&w=600&q=80' },
  { id: 10, name: 'Simba',   type: 'Cat',    breed: 'Tabby',            age: 6, available: true,  description: 'Wise and mellow, perfect family cat.',              image_url: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?auto=format&fit=crop&w=600&q=80' },
];

const FILTERS = ['All', 'Dog', 'Cat', 'Rabbit'];

const TYPE_COLORS = {
  Dog:    'bg-amber-100  text-amber-700',
  Cat:    'bg-blue-100   text-blue-700',
  Rabbit: 'bg-green-100  text-green-700',
};

export default function Pets() {
  const [pets, setPets]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('All');
  const [liked, setLiked]     = useState(new Set());

  useEffect(() => {
    axios.get(`${API_BASE}/api/pets/pets`)
      .then(res => {
        setPets(Array.isArray(res.data) ? res.data : FALLBACK_PETS);
      })
      .catch(() => setPets(FALLBACK_PETS))
      .finally(() => setLoading(false));
  }, []);

  const toggleLike = (id) => {
    setLiked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const visible = filter === 'All' ? pets : pets.filter(p => p.type === filter);

  return (
    <div className="bg-cream min-h-screen">
      {/* Header */}
      <div className="bg-burgundy-50 py-14 text-center border-b border-burgundy-100">
        <h1 className="text-4xl lg:text-5xl font-bold text-primary font-serif mb-3">Meet Our Furry Friends</h1>
        <p className="text-gray-500 max-w-xl mx-auto text-lg">
          Discover adorable pets waiting for a visit, a cuddle, or a forever home.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filter pills */}
        <div className="flex flex-wrap gap-3 mb-10 justify-center">
          {FILTERS.map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition ${
                filter === f
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
              }`}>
              {f === 'All' ? '🐾 All Pets' : f === 'Dog' ? '🐶 Dogs' : f === 'Cat' ? '🐱 Cats' : '🐰 Rabbits'}
            </button>
          ))}
          <span className="px-4 py-2.5 text-sm text-gray-400 self-center">
            {visible.length} pet{visible.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-burgundy-100 border-t-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
            {visible.map(pet => (
              <div key={pet.id ?? pet._id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover-lift border border-gray-100 group flex flex-col">
                {/* Image */}
                <div className="relative h-56 overflow-hidden bg-burgundy-50">
                  <img src={pet.image_url} alt={pet.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition duration-500"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80'; }}
                  />
                  {/* Type badge */}
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold ${TYPE_COLORS[pet.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {pet.type}
                  </span>
                  {/* Adopted badge */}
                  {!pet.available && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-gray-800 font-bold px-4 py-1.5 rounded-full text-sm">Adopted</span>
                    </div>
                  )}
                  {/* Heart */}
                  <button
                    onClick={() => toggleLike(pet.id ?? pet._id)}
                    className={`absolute top-3 right-3 p-2 rounded-full transition shadow ${
                      liked.has(pet.id ?? pet._id)
                        ? 'bg-primary text-white'
                        : 'bg-white/80 backdrop-blur text-gray-400 hover:text-primary'
                    }`}>
                    <Heart className="w-4 h-4" fill={liked.has(pet.id ?? pet._id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
                      <p className="text-primary font-medium text-sm">{pet.breed}</p>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>{pet.age}y</span>
                    </div>
                  </div>
                  {pet.description && (
                    <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">{pet.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
                    <MapPin className="w-3 h-3" />
                    <span>Happy Paws Shelter</span>
                  </div>
                  {pet.available ? (
                    <Link to={`/booking?pet=${pet.id ?? pet._id}`}
                      className="block w-full text-center bg-burgundy-50 hover:bg-primary hover:text-white text-primary font-bold py-2.5 rounded-xl transition duration-300 text-sm">
                      Book a Visit
                    </Link>
                  ) : (
                    <button disabled
                      className="w-full bg-gray-100 text-gray-400 font-bold py-2.5 rounded-xl text-sm cursor-not-allowed">
                      Currently Adopted
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

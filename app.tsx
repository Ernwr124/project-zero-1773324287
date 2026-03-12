import React, { useState, useEffect, useRef, useMemo, useCallback } from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4?deps=react@18.2.0,react-dom@18.2.0';
import * as Lucide from 'https://esm.sh/lucide-react@0.263.1?deps=react@18.2.0,react-dom@18.2.0';

const GAMES = [
    {
        id: 1,
        title: "Cyberpunk 2077",
        price: "$59.99",
        discount: "-50%",
        finalPrice: "$29.99",
        tags: ["Open World", "RPG", "Sci-fi"],
        image: "https://images.unsplash.com/photo-1605898835373-02f8409bf136?auto=format&fit=crop&q=80&w=1200",
        screenshots: [
            "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400",
            "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400"
        ]
    },
    {
        id: 2,
        title: "Elden Ring",
        price: "$59.99",
        discount: "",
        finalPrice: "$59.99",
        tags: ["Souls-like", "Fantasy", "Action"],
        image: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200",
        screenshots: [
            "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400",
            "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=400"
        ]
    },
    {
        id: 3,
        title: "Starfield",
        price: "$69.99",
        discount: "-20%",
        finalPrice: "$55.99",
        tags: ["Space", "Exploration", "RPG"],
        image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1200",
        screenshots: [
            "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=400",
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400"
        ]
    }
];

const Navbar = () => (
    <nav className="bg-[#171a21] text-[#dcdedf] text-sm uppercase tracking-wider">
        <div className="max-w-7xl mx-auto px-4 flex items-center h-16">
            <div className="flex items-center space-x-8">
                <img src="https://store.cloudflare.steamstatic.com/public/shared/images/header/logo_steam.svg?t=962016" className="h-11" alt="Steam Logo" />
                <div className="flex space-x-6 font-semibold">
                    <a href="#" className="text-white hover:text-blue-400">Store</a>
                    <a href="#" className="hover:text-blue-400">Community</a>
                    <a href="#" className="hover:text-blue-400">About</a>
                    <a href="#" className="hover:text-blue-400">Support</a>
                </div>
            </div>
            <div className="ml-auto flex items-center space-x-4">
                <button className="bg-[#5c7e10] text-white px-3 py-1 flex items-center space-x-2 text-xs normal-case">
                    <Lucide.Download size={14} />
                    <span>Install Steam</span>
                </button>
                <div className="flex items-center space-x-3 text-[#b8b6b4] normal-case">
                    <Lucide.Bell size={18} />
                    <div className="flex items-center space-x-1">
                        <span>Username</span>
                        <Lucide.ChevronDown size={14} />
                    </div>
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-8 h-8 rounded" />
                </div>
            </div>
        </div>
    </nav>
);

const StoreHeader = () => (
    <div className="bg-[#1b2838] shadow-xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-10 text-xs text-white/80">
            <div className="flex space-x-6">
                <a href="#" className="font-bold text-white">Your Store</a>
                <a href="#" className="hover:text-white">New & Noteworthy</a>
                <a href="#" className="hover:text-white">Categories</a>
                <a href="#" className="hover:text-white">Points Shop</a>
                <a href="#" className="hover:text-white">News</a>
                <a href="#" className="hover:text-white">Labs</a>
            </div>
            <div className="flex items-center bg-[#316282] px-2 py-1 rounded">
                <input type="text" placeholder="search" className="bg-transparent outline-none placeholder-blue-200 text-sm" />
                <Lucide.Search size={16} />
            </div>
        </div>
    </div>
);

const Hero = () => {
    const [activeIdx, setActiveIdx] = useState(0);
    const activeGame = GAMES[activeIdx];

    return (
        <div className="max-w-7xl mx-auto px-4 mt-8">
            <h2 className="text-white text-sm uppercase tracking-widest mb-2 font-light">Featured & Recommended</h2>
            <div className="flex h-[350px] shadow-2xl group cursor-pointer">
                <div className="flex-1 relative overflow-hidden">
                    <AnimatePresence mode='wait'>
                        <motion.img 
                            key={activeGame.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            src={activeGame.image}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </AnimatePresence>
                    <div className="absolute inset-0 hero-overlay flex flex-col justify-end p-8">
                        <h1 className="text-4xl text-white font-light mb-4">{activeGame.title}</h1>
                    </div>
                </div>
                
                <div className="w-80 bg-[#0f1922] p-4 flex flex-col">
                    <h3 className="text-white text-xl mb-4">{activeGame.title}</h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {activeGame.screenshots.map((s, i) => (
                            <img key={i} src={s} className="w-full h-20 object-cover opacity-60 hover:opacity-100 transition-opacity" />
                        ))}
                    </div>
                    <div className="mt-auto">
                        <p className="text-white text-lg">Now Available</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {activeGame.tags.map(t => (
                                <span key={t} className="bg-[#384959] text-[#67c1f5] text-[10px] px-2 py-0.5 rounded">{t}</span>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-white">{activeGame.finalPrice}</span>
                            <div className="bg-[#4c6b22] text-[#beee11] px-1 text-xs">{activeGame.discount}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-center mt-4 space-x-2">
                {GAMES.map((_, i) => (
                    <div 
                        key={i} 
                        onClick={() => setActiveIdx(i)}
                        className={`w-4 h-2 rounded-full cursor-pointer transition-all ${activeIdx === i ? 'bg-white w-8' : 'bg-white/20 hover:bg-white/40'}`}
                    />
                ))}
            </div>
        </div>
    );
};

const Sidebar = () => (
    <div className="w-56 hidden lg:block space-y-6">
        <img src="https://store.cloudflare.steamstatic.com/public/images/gift/steamcards_promo_02.png" className="w-full rounded shadow-lg" />
        <div>
            <h3 className="text-[#316282] text-xs font-bold uppercase mb-2">Gift Cards</h3>
            <p className="text-[#8f98a0] text-xs">Now available on Steam</p>
        </div>
        <div>
            <h3 className="text-[#316282] text-xs font-bold uppercase mb-2">Recommended</h3>
            <ul className="text-[#66c0f4] text-sm space-y-1">
                <li className="hover:text-white cursor-pointer">By Friends</li>
                <li className="hover:text-white cursor-pointer">By Curators</li>
                <li className="hover:text-white cursor-pointer">Tags</li>
            </ul>
        </div>
        <div>
            <h3 className="text-[#316282] text-xs font-bold uppercase mb-2">Browse Categories</h3>
            <ul className="text-[#66c0f4] text-sm space-y-1">
                <li className="hover:text-white cursor-pointer">Top Sellers</li>
                <li className="hover:text-white cursor-pointer">New Releases</li>
                <li className="hover:text-white cursor-pointer">Upcoming</li>
                <li className="hover:text-white cursor-pointer">Specials</li>
                <li className="hover:text-white cursor-pointer">VR Titles</li>
            </ul>
        </div>
    </div>
);

const GameCard = ({ game }) => (
    <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-[#0f1922]/60 hover:bg-[#16242e] transition-colors cursor-pointer group shadow-xl"
    >
        <div className="relative h-32 overflow-hidden">
            <img src={game.image} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
            {game.discount && (
                <div className="absolute bottom-2 right-2 bg-[#4c6b22] text-[#beee11] px-1 font-bold text-lg">
                    {game.discount}
                </div>
            )}
        </div>
        <div className="p-3">
            <h4 className="text-white text-sm font-medium truncate">{game.title}</h4>
            <div className="flex items-center space-x-2 mt-1">
                <Lucide.Monitor size={12} className="text-gray-400" />
                <Lucide.Gamepad2 size={12} className="text-gray-400" />
            </div>
            <div className="flex items-center justify-end space-x-2 mt-2">
                {game.discount && <span className="text-gray-500 line-through text-xs">{game.price}</span>}
                <span className="text-[#acdbf5] text-sm">{game.finalPrice}</span>
            </div>
        </div>
    </motion.div>
);

const App = () => {
    return (
        <div className="min-h-screen pb-20">
            <Navbar />
            <StoreHeader />
            
            <Hero />

            <main className="max-w-7xl mx-auto px-4 mt-12 flex space-x-8">
                <Sidebar />
                
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white text-sm uppercase tracking-widest">Special Offers</h2>
                        <button className="text-xs border border-white/20 px-2 py-1 hover:border-white transition-colors">Browse More</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {GAMES.map(game => <GameCard key={game.id} game={game} />)}
                        <GameCard game={{...GAMES[0], id: 4, title: "Cyberpunk: Phantom Liberty", discount: "-15%", finalPrice: "$25.49"}} />
                        <GameCard game={{...GAMES[1], id: 5, title: "Elden Ring: Shadow of Erdtree", discount: "", finalPrice: "$39.99"}} />
                        <GameCard game={{...GAMES[2], id: 6, title: "Starfield: Deluxe Edition", discount: "-10%", finalPrice: "$89.99"}} />
                    </div>

                    <div className="mt-12">
                        <h2 className="text-white text-sm uppercase tracking-widest mb-4">Browse by genre</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['Action', 'Adventure', 'Strategy', 'RPG'].map(genre => (
                                <div key={genre} className="h-32 relative overflow-hidden group cursor-pointer">
                                    <img src={`https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400&genre=${genre}`} className="w-full h-full object-cover brightness-50 group-hover:brightness-75 transition-all" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg drop-shadow-lg">{genre}</span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-1 steam-gradient transform translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="mt-20 border-t border-white/10 bg-[#171a21] py-12">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center opacity-50 text-xs text-white">
                    <div className="flex flex-col space-y-2">
                        <p>© 2023 Valve Corporation. All rights reserved. All trademarks are property of their respective owners.</p>
                        <div className="flex space-x-4">
                            <a href="#">Privacy Policy</a>
                            <a href="#">Legal</a>
                            <a href="#">Steam Subscriber Agreement</a>
                            <a href="#">Refunds</a>
                        </div>
                    </div>
                    <img src="https://store.cloudflare.steamstatic.com/public/shared/images/footer/logo_valve_footer.png" className="h-8 mt-4 md:mt-0" />
                </div>
            </footer>
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
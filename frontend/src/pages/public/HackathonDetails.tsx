import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

const AnimatedAmount = ({ text }: { text: string }) => {
  const [current, setCurrent] = useState<number | null>(null);
  
  const match = text.match(/([^\d]*)((?:\d+,?)+)(.*)/);
  if (!match) return <span>{text}</span>;
  
  const prefix = match[1];
  const numberStr = match[2];
  const suffix = match[3];
  const targetNumber = parseInt(numberStr.replace(/,/g, ''), 10);
  
  if (isNaN(targetNumber)) return <span>{text}</span>;

  useEffect(() => {
    let startTime: number;
    const duration = 1500; // 1.5 seconds
    const startValue = Math.floor(targetNumber * 0.9);

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = (time - startTime) / duration;

      if (progress < 1) {
        const easeOut = 1 - Math.pow(2, -10 * progress);
        setCurrent(Math.floor(startValue + (targetNumber - startValue) * easeOut));
        requestAnimationFrame(animate);
      } else {
        setCurrent(targetNumber);
      }
    };

    requestAnimationFrame(animate);
  }, [targetNumber]);

  if (current === null) return <span>{text}</span>;
  return <span>{prefix}{current.toLocaleString('en-IN')}{suffix}</span>;
};

export const HackathonDetails = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const activeSlug = slug || 'dogfood-72-hour-hackathon';
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/public/events/${activeSlug}/public`);
        setEvent(response.data);
      } catch (error) {
        console.error("Failed to fetch event", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [activeSlug]);

  const [bannerIndex, setBannerIndex] = useState(0);
  
  useEffect(() => {
    if (!event?.banner_url) return;
    const urls = event.banner_url.split(',').filter(Boolean);
    if (urls.length <= 1) return;
    
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % urls.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [event?.banner_url, bannerIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bauhaus-bg text-bauhaus-fg">
        <div className="text-4xl font-black uppercase tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bauhaus-bg text-bauhaus-fg">
        <div className="text-4xl font-black uppercase">Event Not Found</div>
      </div>
    );
  }

  const bannerUrls = event.banner_url 
    ? event.banner_url.split(',').filter(Boolean).map((u: string) => u.startsWith('/uploads') ? `${u}` : u) 
    : [];

  return (
    <div className="min-h-screen bg-bauhaus-bg text-bauhaus-fg font-sans selection:bg-bauhaus-primary selection:text-white">


      {/* Banner */}
      {bannerUrls.length > 0 && (
        <div 
          className="relative w-full overflow-hidden border-b-8 border-bauhaus-border bg-bauhaus-card group"
        >
          {bannerUrls.map((url: string, idx: number) => (
            <img 
              key={idx}
              src={url} 
              alt={`Hackathon Banner ${idx + 1}`} 
              className={`w-full h-auto object-cover transition-opacity duration-500 ease-in-out ${idx === bannerIndex ? 'opacity-100 z-10 relative' : 'opacity-0 z-0 absolute top-0 left-0'}`} 
            />
          ))}
          {bannerUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {bannerUrls.map((_: any, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setBannerIndex(idx)}
                  className={`w-3 h-3 rounded-full border-2 border-white transition-colors ${idx === bannerIndex ? 'bg-white' : 'bg-transparent'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {bannerUrls.length === 0 && <div className="pt-24"></div>}

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative">
        
        {/* Geometric Decorations */}
        <div className="absolute top-0 right-10 w-20 h-20 bg-bauhaus-accent border-4 border-bauhaus-border transform rotate-12 -z-10 hidden md:block"></div>
        <div className="absolute top-40 left-10 w-16 h-16 rounded-full bg-bauhaus-primary border-4 border-bauhaus-border -z-10 hidden md:block"></div>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-24">
          <div className="flex-1">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
              {event.name}
            </h1>
            <div className="flex flex-wrap gap-4 mb-8">
              {event.team_size_min && event.team_size_max && (
                <div className="bauhaus-card px-4 py-2 font-bold uppercase text-sm">
                  <span className="text-bauhaus-primary">
                    {event.team_size_min === 1 && event.team_size_max === 1 ? 'Participation:' : 'Team Size:'}
                  </span>{' '}
                  {event.team_size_min === 1 && event.team_size_max === 1
                    ? 'Individual Participant'
                    : `${event.team_size_min}–${event.team_size_max} Members`}
                </div>
              )}
              {event.category && (
                <div className="bauhaus-card px-4 py-2 font-bold uppercase text-sm">
                  <span className="text-bauhaus-primary">Category:</span> {event.category}
                </div>
              )}
              {event.prize_pool && (
                <div className="bauhaus-card px-4 py-2 font-bold uppercase text-sm">
                  <span className="text-bauhaus-primary">Prize Pool:</span> <AnimatedAmount text={event.prize_pool} />
                </div>
              )}
              {event.mode && (
                <div className="bauhaus-card px-4 py-2 font-bold uppercase text-sm">
                  <span className="text-bauhaus-primary">Mode:</span> {event.mode}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Link to="/participant/team/create" className="bauhaus-button inline-block text-center">
                Join / Create Team
              </Link>
            </div>
          </div>
          
          {(event.organizer_logo || event.organizer_name) && (
            <div className="bauhaus-card p-6 min-w-[250px] relative">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-bauhaus-secondary border-4 border-bauhaus-border transform rotate-45"></div>
              <p className="text-sm font-bold uppercase tracking-widest text-bauhaus-primary mb-4">Organized By</p>
              {event.organizer_logo && (
                <img src={event.organizer_logo} alt={event.organizer_name} className="h-16 object-contain mb-4" />
              )}
              {event.organizer_name && (
                <p className="font-bold text-xl uppercase">{event.organizer_name}</p>
              )}
            </div>
          )}
        </div>

        <hr className="border-t-4 border-bauhaus-border mb-24" />

        {/* About Section */}
        {event.full_description && (
          <section className="mb-24">
            <h2 className="text-4xl font-black uppercase mb-8 flex items-center gap-4">
              <span className="w-8 h-8 bg-bauhaus-accent border-4 border-bauhaus-border block"></span>
              About The Hackathon
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none font-medium leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: event.full_description }} />
            </div>
          </section>
        )}

        {/* Eligibility Section */}
        {event.show_eligibility && event.eligibility_items?.length > 0 && (
          <section className="mb-24">
            <h2 className="text-4xl font-black uppercase mb-8 flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-bauhaus-primary border-4 border-bauhaus-border block"></span>
              Eligibility
            </h2>
            <div className="grid gap-6">
              {event.eligibility_items.map((item: any, i: number) => (
                <div key={item.id} className="bauhaus-card p-6 flex gap-6 items-start">
                  <div className="text-3xl font-black text-bauhaus-secondary">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold uppercase mb-2">{item.title}</h3>
                    {item.description && <p className="text-lg opacity-90">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rules Section */}
        {event.show_rules && event.rules?.length > 0 && (
          <section className="mb-24">
            <h2 className="text-4xl font-black uppercase mb-8 flex items-center gap-4">
              <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-b-[28px] border-l-transparent border-r-transparent border-b-bauhaus-secondary border-solid"></div>
              Rules
            </h2>
            <div className="flex flex-col gap-0 border-4 border-bauhaus-border bg-bauhaus-card">
              {event.rules.map((rule: any, i: number) => (
                <div key={rule.id} className={`p-6 flex gap-6 items-start ${i !== event.rules.length - 1 ? 'border-b-4 border-bauhaus-border' : ''}`}>
                  <div className="text-2xl font-black bg-bauhaus-primary text-white w-12 h-12 flex items-center justify-center border-4 border-bauhaus-border">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-xl font-bold uppercase mb-2">{rule.title}</h3>
                    {rule.description && <p className="opacity-90">{rule.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Prizes Section */}
        {event.show_prizes && event.prizes?.length > 0 && (
          <section className="mb-24 relative">
            <div className="absolute top-1/2 left-0 right-0 h-4 bg-bauhaus-border transform -translate-y-1/2 -z-10"></div>
            <h2 className="text-4xl font-black uppercase mb-16 text-center bg-bauhaus-bg inline-block px-8 relative left-1/2 transform -translate-x-1/2">
              Prizes
            </h2>
            <div className="flex flex-wrap justify-center gap-8">
              {event.prizes.map((prize: any, i: number) => (
                <div key={prize.id} className="bauhaus-card p-8 text-center flex-1 min-w-[250px] max-w-[400px] relative hover:-translate-y-2 transition-transform">
                  <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 flex items-center justify-center font-black border-4 border-bauhaus-border text-white text-xl
                    ${i === 0 ? 'bg-bauhaus-accent text-black rotate-45' : i === 1 ? 'bg-bauhaus-primary rounded-full' : 'bg-bauhaus-secondary'}
                  `}>
                    <span className={i === 0 ? '-rotate-45' : ''}>{i + 1}</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase mt-6 mb-2 text-bauhaus-primary">{prize.title}</h3>
                  {prize.amount && <div className="text-4xl font-black mb-4"><AnimatedAmount text={prize.amount} /></div>}
                  {prize.description && <p className="font-medium opacity-80">{prize.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dates & Deadlines */}
        {event.show_timeline && event.timeline_items?.length > 0 && (
          <section className="mb-32">
            <h2 className="text-4xl font-black uppercase mb-12">Dates & Deadlines</h2>
            <div className="relative border-l-8 border-bauhaus-border ml-6 md:ml-12">
              {event.timeline_items.map((item: any, i: number) => {
                const now = new Date().getTime();
                const startTime = new Date(item.start_datetime).getTime();
                const endTime = item.end_datetime 
                  ? new Date(item.end_datetime).getTime() 
                  : (i + 1 < event.timeline_items.length 
                      ? new Date(event.timeline_items[i+1].start_datetime).getTime() 
                      : startTime + 24 * 60 * 60 * 1000); // default to 24h if it's the last item without end date
                
                const isLive = now >= startTime && now <= endTime;
                const isOver = now > endTime;

                return (
                  <div key={item.id} className={`mb-12 pl-12 relative group ${isOver ? 'opacity-60' : ''}`}>
                    <div className={`absolute -left-[14px] top-0 w-5 h-5 border-4 ${isOver ? 'border-gray-400' : 'border-bauhaus-border'} rounded-full bg-bauhaus-card
                      ${isLive ? 'bg-green-500 border-green-500 animate-pulse w-6 h-6 -left-[16px]' : ''}
                      ${!isLive && !isOver ? 'group-hover:bg-bauhaus-secondary' : ''} transition-colors
                    `}></div>
                    <h3 className={`text-2xl font-black uppercase mb-1 ${isLive ? 'text-green-500' : isOver ? 'text-gray-500' : ''}`}>{item.title}</h3>
                    <div className={`font-bold text-xl mb-2 flex flex-col md:flex-row md:items-center gap-1 md:gap-3 ${isLive ? 'text-green-600' : isOver ? 'text-gray-400' : 'text-bauhaus-primary'}`}>
                      <span>
                        {new Date(item.start_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' • '}
                        {new Date(item.start_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {item.end_datetime && (
                        <>
                          <span className="hidden md:inline opacity-50">→</span>
                          <span>
                            {new Date(item.end_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {' • '}
                            {new Date(item.end_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>
                    {item.description && <p className={`${isOver ? 'text-gray-500' : 'opacity-90'}`}>{item.description}</p>}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Navigation Cards (Teams / Projects / Results) */}
        <section className="mb-24 flex flex-col md:flex-row gap-6">
          {event.show_public_teams && (
            <div onClick={() => navigate('/participant/team/join')} className="bauhaus-card flex-1 p-8 text-center flex flex-col items-center justify-center hover:bg-bauhaus-primary hover:text-white transition-colors group cursor-pointer">
              <h3 className="text-2xl font-black uppercase mb-4">Teams</h3>
              <div className="text-6xl font-black mb-6 group-hover:scale-110 transition-transform">{event.team_count || 0}</div>
              <span className="font-bold uppercase tracking-widest text-sm border-b-2 border-transparent group-hover:border-white pb-1">View Teams →</span>
            </div>
          )}
          {event.show_public_projects && (
            <div onClick={() => alert('Projects gallery coming soon!')} className="bauhaus-card flex-1 p-8 text-center flex flex-col items-center justify-center hover:bg-bauhaus-secondary hover:text-white transition-colors group cursor-pointer">
              <h3 className="text-2xl font-black uppercase mb-4">Projects</h3>
              <div className="text-6xl font-black mb-6 group-hover:scale-110 transition-transform">{event.project_count || 0}</div>
              <span className="font-bold uppercase tracking-widest text-sm border-b-2 border-transparent group-hover:border-white pb-1">View Projects →</span>
            </div>
          )}
          {event.show_public_results && (
            <div onClick={() => alert('Results coming soon!')} className="bauhaus-card flex-1 p-8 text-center flex flex-col items-center justify-center hover:bg-bauhaus-accent hover:text-black transition-colors group cursor-pointer">
              <h3 className="text-2xl font-black uppercase mb-4">Results</h3>
              <div className="text-6xl font-black mb-6 group-hover:scale-110 transition-transform">🏆</div>
              <span className="font-bold uppercase tracking-widest text-sm border-b-2 border-transparent group-hover:border-black pb-1">View Results →</span>
            </div>
          )}
        </section>

        {/* Judges removed entirely per user request */}

        {/* Contact Admin */}
        {event.show_contacts && event.admin_contacts?.length > 0 && (
          <section className="mb-24">
            <h2 className="text-4xl font-black uppercase mb-8 text-center">Contact Admin</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {event.admin_contacts.map((contact: any) => (
                <div key={contact.id} className="bauhaus-card p-6 flex items-center gap-6 min-w-[300px]">
                  {contact.photo_url ? (
                    <img src={contact.photo_url} alt={contact.name} className="w-16 h-16 rounded-full border-4 border-bauhaus-border object-cover" />
                  ) : (
                    <div className="w-16 h-16 border-4 border-bauhaus-border bg-bauhaus-secondary rotate-12"></div>
                  )}
                  <div>
                    <h4 className="text-xl font-black uppercase">{contact.name}</h4>
                    <div className="flex gap-4 mt-2">
                      {contact.email && <a href={`mailto:${contact.email}`} className="text-xs font-bold uppercase border-b-2 border-bauhaus-border hover:text-bauhaus-primary">Email</a>}
                      {contact.phone && <a href={`tel:${contact.phone}`} className="text-xs font-bold uppercase border-b-2 border-bauhaus-border hover:text-bauhaus-secondary">Phone: {contact.phone}</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

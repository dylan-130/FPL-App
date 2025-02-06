import Navbar from '../Components/Navbar';
import '../App.css';

const PlayerCard = ({ name, club, points, isCaptain, isViceCaptain }: any) => {
  return (
    <div className="player-card">
      <div className="circle-icon"></div>
      <p>{name}</p>
      <p>{club}</p>
      <p>{points} pts</p>
      {isCaptain && <span className="captain-icon">C</span>}
      {isViceCaptain && <span className="vice-captain-icon">V</span>}
    </div>
  );
};

const Connect = () => {
  return (
    <>
      <Navbar />
      <div className="connect-page">
        <section className="goalkeeper">
          <PlayerCard name="Goalkeeper" club="Club Name" points={10} />
        </section>

        <section className="defenders">
          {[...Array(5)].map((_, i) => (
            <PlayerCard key={i} name={`Defender ${i + 1}`} club="Club Name" points={10} />
          ))}
        </section>

        <section className="midfielders">
          {[...Array(5)].map((_, i) => (
            <PlayerCard key={i} name={`Midfielder ${i + 1}`} club="Club Name" points={8} />
          ))}
        </section>

        <section className="forwards">
          {[...Array(3)].map((_, i) => (
            <PlayerCard key={i} name={`Forward ${i + 1}`} club="Club Name" points={12} />
          ))}
        </section>

        <section className="bench">
          {[...Array(5)].map((_, i) => (
            <PlayerCard
              key={i}
              name={`Sub ${i + 1}`}
              club="Club Name"
              points={3 + i}
            />
          ))}
        </section>
      </div>
    </>
  );
};

export default Connect;

import Navbar from '../Components/Navbar/Navbar';
import '../styles/Global.css';
import '../Components/Navbar/Navbar.css';
import '../styles/Connect.css';
import PlayerCard from '../Components/PlayerCard/PlayerCard';
import Button from '../Components/Button/Button';

const Connect = () => {
  return (
    <>
      <Navbar />
      <div className="connect-page">
        
        {/* Team Info at the top-left */}
        <div className="team-info">
          <div className="team-name">Team Name</div>
          <div className="team-manager">Dylan Byrne</div>
          <div className="game-week">GW 20</div>
          <div className="points">Points: 54</div>
        </div>

        <section className="goalkeeper">
          <PlayerCard name="Goalkeeper" points={10} />
        </section>

        <section className="defenders">
          {[...Array(5)].map((_, i) => (
            <PlayerCard key={i} name={`Defenders ${i + 1}`} points={10} />
          ))}
        </section>

        <section className="midfielders">
          {[...Array(5)].map((_, i) => (
            <PlayerCard key={i} name={`Midfielders ${i + 1}`} points={8} />
          ))}
        </section>

        <section className="forwards">
          {[...Array(3)].map((_, i) => (
            <PlayerCard key={i} name={`Calvert-Lewin ${i + 1}`} points={12} />
          ))}
        </section>

        <section className="bench">
          {[...Array(5)].map((_, i) => (
            <PlayerCard
              key={i}
              name={`Substitutions ${i + 1}`}
              points={3 + i}
            />
          ))}
        </section>
      </div>

      {/* Bottom-right buttons */}
      <div className="bottom-right-buttons">
        <Button 
          label="Confirm & Get Bet-Builder" 
          onClick={() => console.log('Confirm clicked')} 
          className="confirm-button" 
        />
        <Button 
          label="Cancel" 
          onClick={() => console.log('Cancel clicked')} 
          className="cancel-button" 
        />
      </div>
    </>
  );
};

export default Connect;

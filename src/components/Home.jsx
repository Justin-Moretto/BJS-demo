import { Deck, Hand } from "../helpers/cardLogic";
import useApplicationData from "../hooks/useApplicationData"

import Table from "./Table";
import Chips from "./Chips";
import Actions from './Actions';

import "./CSS/Home.css";

let deck = new Deck(6);
let dealer = new Hand();

//REFACTOR EVERYTHING
let totalWins = 0;
let totalLosses = 0;
let totalDraws = 0;
let totalBlackjacks = 0;

let dealerFirstHit = false;

let previousBet = 0;

export default function Home(props) {
  const {
    state,
    updateHand,
    spawnSplitHand,
    updateActions,
    addBet,
    clearBet,
    updateBet,
    recordStats,
    rebet
  } = useApplicationData();

  let hand = state.hand;
  let currentHand = state.currentHand;
  let actions = state.actions;
  let bet = state.bet;
  let bankroll = state.bankroll;
  let initBankroll = state.initBankroll;

  

  const checkBlackjack = () => {
    if (hand[currentHand]) {
      if (hand[currentHand].value >= 21 && state.turn === "player") {
        stay()
      }
    }
  }

  const deal = () => {
    //previousBet = bet;
    if (bet <= 0){
      window.alert(`Place a bet to play!`)
    } else{
      actions.deal.enabled = false;
      updateActions(-1, "deal")
  
      setTimeout(() => { hit(hand[0]); console.log('1') }, 350);
      setTimeout(() => { hit(hand[0]); console.log('3') }, 1400);
  
      setTimeout(() => { hit(hand[1]); console.log('2') }, 700);
      setTimeout(() => { hit(hand[1]); console.log('4') }, 1750);
  
      setTimeout(() => { hit(dealer) }, 1050);
      setTimeout(() => { updateActions(0, "player") }, 2200);
    }
  }
  actions.deal.execute = () => deal();

  const hit = async (hand) => {
    hand.add(deck.draw())
    updateHand(hand);
    actions.switch.enabled = false;
  }
  actions.hit.execute = () => hit(hand[currentHand]);

  const stay = () => {
    if (currentHand < hand.length - 1) {
      updateHand(hand[currentHand]);
      currentHand++
      updateActions(currentHand, "player");
    } else if (currentHand === hand.length - 1) {
      updateActions(-1, "dealer");
    }
  }
  actions.stay.execute = () => stay();

  const split = () => {
    if (bet > bankroll) {
      window.alert(`Insufficient funds, you are missing ${bet - bankroll}$`)
    } else {
      if (hand[currentHand].canSplit === true) {
        hand[currentHand].canSplit = false;
        let newHand = new Hand(hand[currentHand].splitHand(), bet)
        spawnSplitHand(newHand);
        updateHand(hand[currentHand]);
        updateHand(hand[currentHand + 1]);
        setTimeout(() => { hit(hand[currentHand]) }, 500);
        setTimeout(() => { hit(hand[currentHand + 1]) }, 1000);
        updateBet(bet);
      }
    }
  }
  actions.split.execute = () => split();

  const doubleDown = () => {
    if (bet > bankroll) {
      window.alert(`Insufficient funds, you are missing ${bet - bankroll}$`)
    } else {
      hit(hand[currentHand]);
      hand[currentHand].bet += bet;
      updateHand(hand[currentHand]);
      updateBet(bet);
      stay();
    }
  }
  actions.double.execute = () => doubleDown();

  //switch is not allowed as a function name in js, use swap instead
  const swap = (hand1, hand2) => {
    if (actions.switch.enabled) {
      let temp = hand1.cards[1];
      hand1.cards[1] = hand2.cards[1];
      hand2.cards[1] = temp;
      updateHand(hand1);
      updateHand(hand2);
    }
  }
  actions.switch.execute = () => swap(hand[0], hand[1]);
  
  const clearTable = async () => {
    previousBet = 0;
    updateActions(-1, "bet");
    setTimeout(()=> {
      dealer = new Hand();
      clearBet()
    }, 600)
  }
  actions.reset.execute = () => clearTable();

//   const rebet3 = new Promise((resolve, reject) => {    
//     let rebet = true   
//     if(rebet) {    
//         resolve(clearTable());  
//     } else {    
//         reject('Uh-oh');  
//     }
// });



  const rebet2 = () => {
    // updateActions(-1, "bet");
    clearTable().then(() => {
        deal()
    })
    // setTimeout(()=> {
    //   addBet(previousBet)
    // }, 600)
    //rebet()
  }
  actions.rebet.execute = () => rebet2();

  const dealerPlays = () => {
    if (state.turn === "dealer") {
      if (dealer.value < 17 || (dealer.ace > 0 && dealer.value === 17)) {
        hit(dealer).then(res => {
          setTimeout(() => { dealerPlays() }, 700);
        })
      } else {
        dealerFirstHit = false;
        updateActions(-1, "reveal");
        recordStats(hand);
      }
    }
  }

  if (state.turn === "dealer" && dealerFirstHit === false) {
    dealerFirstHit = true;
    dealerPlays();
  }

  checkBlackjack();

  // shuffle
  if (state.turn === "reveal" && deck.cards.length < deck.resetCards.length / 2) {
    deck.reset()
  }

  if (hand[currentHand] && state.turn === "player") {
    actions.split.enabled = hand[currentHand].canSplit;
    if (hand[currentHand].cards.length > 2) actions.double.enabled = false;
  }


  const connectingToServer = () => {
    if (state.connectingToServer) {
      return (
        <div>
          <h3>Connecting to server...</h3>
        </div>
      )
    }
  }

  return (
    <div class="table" >
      <Table
        cardLibrary={state.cards}
        deck={deck}
        hand={hand}
        dealer={dealer}
        currentHand={currentHand}
        stats={state.stats}
        bet={bet}
        turn={state.turn}
      />
      {connectingToServer()}
      <Actions
        actions={actions}
      />
      <Chips
        addBet5={() => addBet(5)}
        addBet25={() => addBet(25)}
        addBet100={() => addBet(100)}
        addBet500={() => addBet(500)}
        maxBet={() => addBet(state.bankroll/2)}
        clearBet={() => clearBet()}
        bet={bet}
        bankroll={bankroll}
        initialBankroll={initBankroll}
        turn={state.turn}
        hand={hand}
      />
    </div>
  )
}
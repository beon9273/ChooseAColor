# Choose A Color Square

**Play it here: https://beon9273.github.io/ChooseAColor/**

## The story

Choose A Color Square is a game that **Connor invented**.

He drew the whole game on a piece of paper and had us all play it while he hosted. He had Cheat Codes, Extra Rolls, Treat Codes, squares that make you lose all your points, and everything else. It was very fun.

After we finished, we asked AI to turn it into a real web app we could install on Dad's phone. The rules and ideas are Connor's. The AI just did the typing.

## How to play

- 2 to 4 players take turns on the same screen. Any player can be the computer, on Easy, Medium or Hard.
- The board has 100 squares, each a different color or pattern: polka dots, stripes, tie-dye, rainbow, plaid and more.
- Every square hides a number from −1,000 to +1,000. Pick one and its number is added to your score.
- **The first player to land on exactly 1,000 points wins.** If nobody gets there after 25 turns each, whoever is closest wins.
- Every board hides a 5-square **Cheat Path** that adds up to exactly 1,000, so you can always win.
- A square you pick is locked for the next 3 turns.

### The shop

| Item | Cost | What it does |
| --- | --- | --- |
| **Cheat Code** | 500 points | Reveals the next square on the Cheat Path. The path only works if you start it at 0 points, so you'll have to find the button that zeroes out your score. |
| **Extra Roll** | 25 points | Spin the wheel to win extra turns. |

### Special squares

There are always exactly **25 special squares** hiding on the board: one of each kind below, plus one extra.

| Square | What happens |
| --- | --- |
| 💀 **Lose It All** | Your score drops to 0. |
| 🎁 **Gift Wrap** | All your points go to another player. |
| 🔄 **Switcheroo** | You swap scores with another player. |
| 🍬 **Treat Code** | Every square shows its number for 3 seconds, then you pick again. |
| ⭐ **Bonus Round** | Everyone rolls once. The highest roll wins the game! |
| ⚰️ **Death** | You're out of the game. If only one player is left, they win. |
| ➖ **Negative** | Everyone's score flips between plus and minus. |
| 🔀 **Shuffle** | Everyone gives their points to someone else. |
| 🥧 **Distribute** | All the points go in one pot and get split evenly. |
| 🏺 **Magic Pots** | Pick one of 3 pots and win whatever is inside. |
| 🃏 **Reshuffle** | Every hidden card moves to a new square. |
| 🧮 **Pop Quiz** | Solve a math problem in 5 seconds to win the points. |
| 🐕 **Dog** | A dog chews up some squares. They are gone for good. |
| 🌪️ **Tornado** | A tornado blows every square to a new spot. |
| 9️⃣ **999** | Your score becomes 999. |
| 3️⃣ **333** | Your score becomes 333. |
| 🌧️ **Bad Luck** | Your score becomes −1. |
| 🦆 **Duck** | A giant duck yells QUACK. That is all. |
| 👇 **Eeny Meeny Miny Moe** | The rhyme picks a player, and that player wins the game! (Only one on the board.) |
| 🔁 **Reset** | The whole game starts over. Everyone goes back to 0. |
| 👃 **No One Nose** | Spin a wheel of special squares and get whatever it lands on. |
| 💰 **$100,000 Prize** | You won $100,000! Click to claim it. (Trust us.) |
| 🤗 **Hug Yo Mom** | Everyone has to go hug their mom. |
| 🎃 **Trick or Treat (But Not For Me)** | Spin the wheel. Trick gives you +100,000. Treat gives you +1,000. |

Every time someone picks a square, it pops up big on the screen with its color, its spot on the grid, and its points, so everyone can see.

When someone wins, a duck eating a pumpkin shows up, followed by the final standings.

## Put it on your phone

Open **https://beon9273.github.io/ChooseAColor/** on your phone, then:

- **iPhone:** in **Safari**, tap **Share**, then **Add to Home Screen**.
- **Android:** in **Chrome**, tap **Install on this device** on the setup screen, or use the **⋮** menu and choose **Install app**.

It shows up on your home screen as **Color Square** and works without internet once it has been opened.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page |
| `style.css` | Colors, layout and the phone layout |
| `game.js` | The game rules and the computer players |
| `manifest.webmanifest`, `sw.js`, `icons/` | Make it installable as a phone app and playable offline |

No build step is needed. To play on a computer, open `index.html` in any web browser.

---

Made by Connor.

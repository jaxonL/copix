# CoPix
## Collaborative pixel-pushing, a public canvas where anyone can create art one pixel at a time.

https://copix-loo.vercel.app/

Copix is a public canvas built on Polygon testnet Mumbai, where each pixel is represented as a unique non-fungible token. These NFT pixels serve as the building blocks for artistic expression. Verified World ID holders can unleash their creativity by freely changing the colours of the pixels. Once a user selects a new colour and applies it to a pixel, they become the proud owner of that pixel, forever leaving their artistic mark on the canvas.

To maintain a balanced and fair environment, Copix implements a thoughtful cooldown mechanism. Following any pixel modification, a 2-minute cooldown period is enforced, preventing consecutive edits in a short time by the same user. This ensures that every frame of the canvas has an opportunity to be appreciated and admired before undergoing further transformations.

In addition to the creative process, Copix offers a captivating journey through pixel history. Users can delve into the extensive metadata records, revealing the fascinating evolution of each pixel over time. This comprehensive history includes past colors chosen, the individuals who contributed and the timestamp of all the activities. With every stroke of color, Copix becomes an ever-evolving masterpiece, shaped collectively by the artistic Web3 community.

## How Copix was made
Copix is deployed on the Polygon testnet Mumbai. 
We used Solidity to write the smart contract for creating and updating the pixel tokens, as well as specifying user actions. We used React to build the frontend webpage. 
We leveraged the Anonymous Action feature of World ID to verify whether or not the user painting is a human. 

## Future considerations
* Add feature to see all previous versions of the canvas
* Add feature to see number of humans contributed to the canvas

## Polygonscan contract
Our latest versions of the contract can be found on Polygon's Mumbai tesnet at https://mumbai.polygonscan.com/address/0xE049de34d004F799b8302FeAeD15EE743F6A4293 (production WorldID verification) and https://mumbai.polygonscan.com/address/0x6Cf1af6D048aB7c9cCC7F35318Cdd9e0bE15B818 (simulator WorldID verification).

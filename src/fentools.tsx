import Chess from 'chess.js';

class FenTools {

    private db: any = {};

    computeOpeningDb(allGames: any[]) {
        this.db = {}; // clear the database first

        allGames.forEach(game => {
            let board = new Chess(); // starting position
            let moves: string[] = game.moves.split(' ');

            let weAreWhite: boolean = (game.ourSide === 'white');

            moves.forEach((currMove, i) => {

                if (i >= 20) {
                    return;
                }

                // The short fen doesn't include the move or halfmove clocks
                let currShortFen = board.fen();
                for (let j = 0; j < 5; j++) {
                    currShortFen = currShortFen.slice(0, currShortFen.lastIndexOf(' '));
                }

                // Only record the move in the game if we made it!
                if ((i % 2 === 0 && weAreWhite) || (i % 2 === 1 && !weAreWhite)) {
                    if (!(Object.keys(this.db).includes(currShortFen))) {
                        this.db[currShortFen] = {};
                    }

                    if (Object.keys(this.db[currShortFen]).includes(currMove)) {
                        this.db[currShortFen][currMove] = this.db[currShortFen][currMove] + 1;
                    } else {
                        this.db[currShortFen][currMove] = 1;
                    }
                }

                board.move(currMove, { sloppy: true });
            });
        });
    }

    getMoves(fen: string) {
        let shortFen = fen;
        let result: any[] = [];
        if (!Object.keys(this.db).includes(shortFen)) {
            return [];
        }
        Object.keys(this.db[shortFen]).forEach(move => {
            result.push({ 'move': move, 'count': (this.db[shortFen])[move] });
        });
        return result;
    }
}

export { FenTools };
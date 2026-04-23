export class SpriteFactory {
    static generateAll(scene: Phaser.Scene): void {
        SpriteFactory.generateEmpty(scene);
        SpriteFactory.generateDirt(scene);
        SpriteFactory.generateDiamond(scene);
        SpriteFactory.generateRock(scene);
        SpriteFactory.generateWall(scene);
        SpriteFactory.generateBrickWall(scene);
        SpriteFactory.generatePlayer(scene);
        SpriteFactory.generateEnemy(scene);
        SpriteFactory.generateBarrier(scene);
        SpriteFactory.generateExitClosed(scene);
        SpriteFactory.generateExitOpen(scene);
    }

    private static make(scene: Phaser.Scene, key: string, fn: (g: Phaser.GameObjects.Graphics) => void): void {
        const g = scene.add.graphics();
        fn(g);
        g.generateTexture(key, 32, 32);
        g.destroy();
    }

    // Vide : fond noir pur
    private static generateEmpty(scene: Phaser.Scene): void {
        SpriteFactory.make(scene, 'tile-empty', g => {
            g.fillStyle(0x000000);
            g.fillRect(0, 0, 32, 32);
        });
    }

    // Terre : vert foncé avec motif feuille/croix (fidèle image 03)
    private static generateDirt(scene: Phaser.Scene): void {
        SpriteFactory.make(scene, 'tile-dirt', g => {
            // Base vert foncé
            g.fillStyle(0x1A7A00);
            g.fillRect(0, 0, 32, 32);
            // Motif croix/feuille en vert plus clair — 4×4 cellules de 8px
            g.fillStyle(0x33CC00);
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    const bx = col * 8;
                    const by = row * 8;
                    // Tige verticale
                    g.fillRect(bx + 3, by + 1, 2, 6);
                    // Tige horizontale
                    g.fillRect(bx + 1, by + 3, 6, 2);
                }
            }
            // Coins des cellules en vert intermédiaire
            g.fillStyle(0x2AAA00);
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    g.fillRect(col * 8, row * 8, 2, 2);
                    g.fillRect(col * 8 + 6, row * 8, 2, 2);
                    g.fillRect(col * 8, row * 8 + 6, 2, 2);
                    g.fillRect(col * 8 + 6, row * 8 + 6, 2, 2);
                }
            }
        });
    }

    // Diamant : gemme taillée multi-couleurs (bleu/blanc/vert/jaune) — fidèle image 03
    private static generateDiamond(scene: Phaser.Scene): void {
        SpriteFactory.make(scene, 'tile-diamond', g => {
            // Facette haute gauche — bleue/cyan
            g.fillStyle(0x44AAFF);
            g.fillTriangle(16, 2, 2, 14, 16, 14);
            // Facette haute droite — blanche (highlight)
            g.fillStyle(0xCCEEFF);
            g.fillTriangle(16, 2, 30, 14, 16, 14);
            // Facette milieu gauche — verte
            g.fillStyle(0x00CC44);
            g.fillTriangle(2, 14, 16, 14, 2, 22);
            // Facette milieu droite — verte claire
            g.fillStyle(0x44FF88);
            g.fillTriangle(30, 14, 16, 14, 30, 22);
            // Facette basse gauche — jaune
            g.fillStyle(0xFFDD00);
            g.fillTriangle(2, 22, 16, 14, 16, 30);
            // Facette basse droite — jaune-orange
            g.fillStyle(0xFF9900);
            g.fillTriangle(30, 22, 16, 14, 16, 30);
            // Contour noir fin
            g.lineStyle(1, 0x000000, 0.8);
            g.beginPath();
            g.moveTo(16, 2);
            g.lineTo(30, 14);
            g.lineTo(30, 22);
            g.lineTo(16, 30);
            g.lineTo(2, 22);
            g.lineTo(2, 14);
            g.closePath();
            g.strokePath();
            // Ligne centrale horizontale (séparation haut/bas)
            g.lineStyle(1, 0x000000, 0.5);
            g.lineBetween(2, 14, 30, 14);
            g.lineBetween(2, 22, 30, 22);
        });
    }

    // Rocher : boule blanche/grise arrondie, très lumineuse — fidèle image 03
    private static generateRock(scene: Phaser.Scene): void {
        SpriteFactory.make(scene, 'tile-rock', g => {
            // Ombre portée grise
            g.fillStyle(0x888888);
            g.fillCircle(17, 17, 13);
            // Corps principal blanc cassé
            g.fillStyle(0xDDDDDD);
            g.fillCircle(15, 15, 13);
            // Zone sombre (ombre interne)
            g.fillStyle(0xAAAAAA);
            g.fillCircle(18, 19, 8);
            // Highlight blanc brillant
            g.fillStyle(0xFFFFFF);
            g.fillCircle(10, 9, 5);
            // Highlight secondaire
            g.fillStyle(0xEEEEEE);
            g.fillCircle(13, 7, 3);
        });
    }

    // Mur : fond noir avec grille de points bleus — fidèle image 03
    private static generateWall(scene: Phaser.Scene): void {
        SpriteFactory.make(scene, 'tile-wall', g => {
            // Fond noir
            g.fillStyle(0x000011);
            g.fillRect(0, 0, 32, 32);
            // Points bleus en grille 4×4
            g.fillStyle(0x0044CC);
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    g.fillRect(col * 8 + 2, row * 8 + 2, 4, 4);
                }
            }
            // Centre des points en bleu vif
            g.fillStyle(0x4488FF);
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    g.fillRect(col * 8 + 3, row * 8 + 3, 2, 2);
                }
            }
        });
    }

    // Mur brique destructible ('M') : brique rouge-brun avec joints blancs
    private static generateBrickWall(scene: Phaser.Scene): void {
        SpriteFactory.make(scene, 'tile-brick', g => {
            // Fond mortier blanc-gris
            g.fillStyle(0xBBAAA0);
            g.fillRect(0, 0, 32, 32);
            // Rangée 1 : 2 briques (décalage 0)
            g.fillStyle(0xAA4422);
            g.fillRect(1, 1, 14, 7);
            g.fillRect(17, 1, 14, 7);
            // Rangée 2 : 3 briques (décalage de 8px)
            g.fillRect(1, 10, 6, 7);
            g.fillRect(9, 10, 14, 7);
            g.fillRect(25, 10, 6, 7);
            // Rangée 3 : 2 briques
            g.fillRect(1, 19, 14, 7);
            g.fillRect(17, 19, 14, 7);
            // Rangée 4 : 3 briques (décalage)
            g.fillRect(1, 28, 6, 3);
            g.fillRect(9, 28, 14, 3);
            g.fillRect(25, 28, 6, 3);
            // Highlights clairs sur arête supérieure des briques
            g.fillStyle(0xCC6644);
            for (const y of [1, 10, 19, 28]) {
                g.fillRect(1, y, 30, 1);
            }
            // Ombres sombres sur arête inférieure
            g.fillStyle(0x772200);
            for (const y of [7, 16, 25]) {
                g.fillRect(1, y, 30, 1);
            }
        });
    }

    // Joueur : chapeau rouge, salopette bleue, visage skin — fidèle image 02/03
    private static generatePlayer(scene: Phaser.Scene): void {
        SpriteFactory.make(scene, 'tile-player', g => {
            // Chapeau rouge (casque de mineur)
            g.fillStyle(0xCC0000);
            g.fillRect(8, 1, 16, 5);
            g.fillRect(6, 5, 20, 3);
            // Bord du chapeau
            g.fillRect(4, 8, 24, 2);
            // Visage (couleur peau)
            g.fillStyle(0xFFAA77);
            g.fillRect(9, 10, 14, 10);
            // Yeux bleus
            g.fillStyle(0x0000CC);
            g.fillRect(11, 12, 3, 3);
            g.fillRect(18, 12, 3, 3);
            // Pupilles noires
            g.fillStyle(0x000000);
            g.fillRect(12, 13, 2, 2);
            g.fillRect(19, 13, 2, 2);
            // Bouche souriante
            g.fillStyle(0x883300);
            g.fillRect(12, 18, 2, 1);
            g.fillRect(18, 18, 2, 1);
            g.fillRect(14, 19, 4, 1);
            // Salopette bleue
            g.fillStyle(0x0044AA);
            g.fillRect(7, 20, 18, 11);
            // Bretelles / chemise blanche
            g.fillStyle(0xFFFFFF);
            g.fillRect(13, 20, 6, 5);
            // Bouton jaune
            g.fillStyle(0xFFDD00);
            g.fillRect(15, 25, 2, 2);
            // Pieds / chaussures vertes
            g.fillStyle(0x00AA44);
            g.fillRect(6, 29, 8, 3);
            g.fillRect(18, 29, 8, 3);
        });
    }

    // Ennemi : carré violet avec yeux — identique au plan
    private static generateEnemy(scene: Phaser.Scene): void {
        SpriteFactory.make(scene, 'tile-enemy', g => {
            g.fillStyle(0x7700AA);
            g.fillRect(3, 3, 26, 26);
            g.lineStyle(2, 0xBB44FF);
            g.strokeRect(3, 3, 26, 26);
            // Yeux blancs
            g.fillStyle(0xFFFFFF);
            g.fillRect(7, 8, 7, 7);
            g.fillRect(18, 8, 7, 7);
            // Pupilles rouges (hostile)
            g.fillStyle(0xFF0000);
            g.fillRect(9, 10, 3, 4);
            g.fillRect(20, 10, 3, 4);
            // Bouche dentelée
            g.fillStyle(0xFF4400);
            g.fillRect(8, 20, 3, 4);
            g.fillRect(13, 18, 3, 4);
            g.fillRect(18, 20, 3, 4);
            g.fillRect(23, 18, 3, 4);
        });
    }

    // Barrière : cyan avec motif diagonal distinctif
    private static generateBarrier(scene: Phaser.Scene): void {
        SpriteFactory.make(scene, 'tile-barrier', g => {
            g.fillStyle(0x009999);
            g.fillRect(0, 0, 32, 32);
            // Lignes diagonales
            g.lineStyle(2, 0x00FFFF);
            for (let i = -32; i < 64; i += 8) {
                g.lineBetween(i, 0, i + 32, 32);
            }
            // Contour brillant
            g.lineStyle(2, 0x44FFFF);
            g.strokeRect(1, 1, 30, 30);
            // Centre avec symbole ↔ (transformation)
            g.fillStyle(0xFFFFFF);
            g.fillRect(8, 14, 5, 4);
            g.fillRect(19, 14, 5, 4);
            g.fillRect(13, 12, 6, 8);
        });
    }

    // Sortie fermée : contour ROUGE (carré rouge comme dans image 03)
    private static generateExitClosed(scene: Phaser.Scene): void {
        SpriteFactory.make(scene, 'tile-exit-closed', g => {
            // Fond transparent (vide)
            g.fillStyle(0x000000);
            g.fillRect(0, 0, 32, 32);
            // Contour rouge épais (comme dans la référence)
            g.lineStyle(4, 0xFF0000);
            g.strokeRect(4, 4, 24, 24);
            // Coins accentués
            g.fillStyle(0xFF4400);
            g.fillRect(4, 4, 6, 2);
            g.fillRect(4, 4, 2, 6);
            g.fillRect(22, 4, 6, 2);
            g.fillRect(26, 4, 2, 6);
            g.fillRect(4, 22, 2, 6);
            g.fillRect(4, 26, 6, 2);
            g.fillRect(26, 22, 2, 6);
            g.fillRect(22, 26, 6, 2);
        });
    }

    // Sortie ouverte : fond vert brillant, flèche vers l'extérieur
    private static generateExitOpen(scene: Phaser.Scene): void {
        SpriteFactory.make(scene, 'tile-exit-open', g => {
            g.fillStyle(0x002200);
            g.fillRect(0, 0, 32, 32);
            // Halo vert
            g.fillStyle(0x00AA00);
            g.fillRect(4, 4, 24, 24);
            g.fillStyle(0x44FF44);
            g.fillRect(6, 6, 20, 20);
            // Flèche/entrée blanche
            g.fillStyle(0xFFFFFF);
            g.fillTriangle(16, 7, 9, 16, 23, 16);
            g.fillRect(12, 16, 8, 9);
            // Contour vert vif clignotant
            g.lineStyle(2, 0x88FF88);
            g.strokeRect(2, 2, 28, 28);
        });
    }
}

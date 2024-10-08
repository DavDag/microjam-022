import {
    Actor,
    Animation,
    AnimationStrategy,
    Collider, CollisionContact,
    CollisionType,
    Color,
    Engine,
    range, Side,
    SpriteSheet,
    Vector
} from "excalibur";
import {Configs} from "../configs";
import {Resources} from "../assets/resources";
import {Plant} from "./plant";
import {Spawner} from "./spawner";

export class Slime extends Actor {

    private direction = "down";
    private attacking = false;
    private dying = false;

    constructor(private targetPlant: Plant) {
        super({
            name: "slime",
            pos: new Vector(150, 150),
            width: Configs.TileWidth,
            height: Configs.TileHeight,
            color: Color.Violet,
            collisionType: CollisionType.Passive
        });
    }

    onInitialize(engine: Engine) {
        super.onInitialize(engine);

        // Set slime sprite
        const spriteSheet = SpriteSheet.fromImageSource({
            image: Resources.image.Slime,
            grid: {
                rows: 13,
                columns: 7,
                spriteWidth: 32,
                spriteHeight: 32,
            },
            spacing: {
                margin: Vector.Zero,
                originOffset: Vector.Zero,
            },
        });
        const animIdleDown = Animation.fromSpriteSheet(
            spriteSheet,
            range(0, 3),
            Configs.SlimeAnimFrameDuration,
            AnimationStrategy.Loop
        );
        const animIdleRight = Animation.fromSpriteSheet(
            spriteSheet,
            range(7, 10),
            Configs.SlimeAnimFrameDuration,
            AnimationStrategy.Loop
        );
        const animIdleUp = Animation.fromSpriteSheet(
            spriteSheet,
            range(14, 17),
            Configs.SlimeAnimFrameDuration,
            AnimationStrategy.Loop
        );
        const animIdleLeft = Animation.fromSpriteSheetCoordinates({
            spriteSheet: spriteSheet,
            frameCoordinates: [
                { x: 0, y: 1, duration: Configs.SlimeAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 1, y: 1, duration: Configs.SlimeAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 2, y: 1, duration: Configs.SlimeAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 3, y: 1, duration: Configs.SlimeAnimFrameDuration, options: { flipHorizontal: true } },
            ],
            strategy: AnimationStrategy.Loop
        });
        const animRunDown = Animation.fromSpriteSheet(
            spriteSheet,
            range(21, 26),
            Configs.SlimeAnimFrameDuration,
            AnimationStrategy.Loop
        );
        const animRunRight = Animation.fromSpriteSheet(
            spriteSheet,
            range(28, 33),
            Configs.SlimeAnimFrameDuration,
            AnimationStrategy.Loop
        );
        const animRunUp = Animation.fromSpriteSheet(
            spriteSheet,
            range(35, 40),
            Configs.SlimeAnimFrameDuration,
            AnimationStrategy.Loop
        );
        const animRunLeft = Animation.fromSpriteSheetCoordinates({
            spriteSheet: spriteSheet,
            frameCoordinates: [
                { x: 0, y: 4, duration: Configs.SlimeAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 1, y: 4, duration: Configs.SlimeAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 2, y: 4, duration: Configs.SlimeAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 3, y: 4, duration: Configs.SlimeAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 4, y: 4, duration: Configs.SlimeAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 5, y: 4, duration: Configs.SlimeAnimFrameDuration, options: { flipHorizontal: true } },
            ],
            strategy: AnimationStrategy.Loop
        });
        const animAttackDown = Animation.fromSpriteSheet(
            spriteSheet,
            range(42, 48),
            Configs.SlimeAttackAnimFrameDuration,
            AnimationStrategy.Freeze
        );
        animAttackDown.events.on("end", this.onAttackAnimationEnd.bind(this));
        const animAttackRight = Animation.fromSpriteSheet(
            spriteSheet,
            range(49, 55),
            Configs.SlimeAttackAnimFrameDuration,
            AnimationStrategy.Freeze
        );
        animAttackRight.events.on("end", this.onAttackAnimationEnd.bind(this));
        const animAttackUp = Animation.fromSpriteSheet(
            spriteSheet,
            range(56, 62),
            Configs.SlimeAttackAnimFrameDuration,
            AnimationStrategy.Freeze
        );
        animAttackUp.events.on("end", this.onAttackAnimationEnd.bind(this));
        const animAttackLeft = Animation.fromSpriteSheetCoordinates({
            spriteSheet: spriteSheet,
            frameCoordinates: [
                { x: 0, y: 7, duration: Configs.SlimeAttackAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 1, y: 7, duration: Configs.SlimeAttackAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 2, y: 7, duration: Configs.SlimeAttackAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 3, y: 7, duration: Configs.SlimeAttackAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 4, y: 7, duration: Configs.SlimeAttackAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 5, y: 7, duration: Configs.SlimeAttackAnimFrameDuration, options: { flipHorizontal: true } },
                { x: 6, y: 7, duration: Configs.SlimeAttackAnimFrameDuration, options: { flipHorizontal: true } },
            ],
            strategy: AnimationStrategy.Freeze
        });
        animAttackLeft.events.on("end", this.onAttackAnimationEnd.bind(this));
        const animDies = Animation.fromSpriteSheet(
            spriteSheet,
            range(84, 88),
            Configs.SlimeAnimFrameDuration,
            AnimationStrategy.End
        );
        animDies.events.on("end", this.onDieAnimationEnd.bind(this));
        this.graphics.add("idle.down", animIdleDown);
        this.graphics.add("idle.right", animIdleRight);
        this.graphics.add("idle.up", animIdleUp);
        this.graphics.add("idle.left", animIdleLeft);
        this.graphics.add("run.down", animRunDown);
        this.graphics.add("run.right", animRunRight);
        this.graphics.add("run.up", animRunUp);
        this.graphics.add("run.left", animRunLeft);
        this.graphics.add("attack.down", animAttackDown);
        this.graphics.add("attack.right", animAttackRight);
        this.graphics.add("attack.up", animAttackUp);
        this.graphics.add("attack.left", animAttackLeft);
        this.graphics.add("dies", animDies);
        this.graphics.use("idle.left");

        // Update collision box
        this.collider.useBoxCollider(this.width, this.height);

        // Set slime z-index
        this.z = Configs.SlimeZIndex;

        // Make slim move towards the target Plant
        this.actions
            .moveTo(this.targetPlant.pos.sub((this.parent as Spawner).pos), Configs.SlimeSpeed)
            .callMethod(this.startAttackAnimation.bind(this));

        this.graphics.onPreDraw = (ctx) => {
            if (engine.isDebug) {
                ctx.drawCircle(Vector.Zero, 2, Color.Blue);
            }
        };
    }

    public onPreUpdate(engine: Engine, delta: number) {
        if (this.dying) return;

        // Update the slime animation
        if (!this.attacking) {
            this.direction =
                (this.vel.x > 0) ? "right"
                    : (this.vel.x < 0) ? "left"
                        : (this.vel.y > 0) ? "down"
                            : "up";
            const anim = (this.vel.x === 0 || this.vel.y === 0) ? "idle" : "run";
            this.graphics.use(`${anim}.${this.direction}`);
        }
    }

    onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact) {
        if (this.dying) return;

        // Check if the slime is attacked
        if (other.owner.name === "attack") {
            // Stop moving & attacking
            this.dying = true;
            this.attacking = false;
            this.actions.clearActions();

            // Prevent further collisions
            this.body.collisionType = CollisionType.PreventCollision;

            // Die animation
            this.graphics.use("dies");

            // Play the die sound
            void Resources.music.SlimeDies.play(Configs.Volume);
        }
    }

    private startAttackAnimation() {
        // Set slime attacking state
        this.attacking = true;

        // Set the attack animation
        (this.graphics.getGraphic(`attack.${this.direction}`) as Animation).reset();
        this.graphics.use(`attack.${this.direction}`);

        // Play the attack sound
        this.actions
            .delay(Configs.SlimeAttackAnimFrameDuration * 6)
            .callMethod(() => void Resources.music.SlimeLanding.play(Configs.Volume));
    }

    private onAttackAnimationEnd() {
        this.attacking = false;

        // Attack the target Plant
        this.targetPlant.takeDamage();

        // Attack again!
        this.actions
            .delay(Configs.SlimeAttackDelay)
            .callMethod(this.startAttackAnimation.bind(this));
    }

    private onDieAnimationEnd() {
        this.actions.clearActions();
        this.kill();
    }
}

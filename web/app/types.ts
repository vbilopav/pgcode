enum Position { left = "left", right = "right" };
enum Themes { dark = "dark", light = "light" };
enum AppStatus { ready = 0, busy = 1 };

interface IMain {
    moveToolbar(position: Position) : boolean
    setStatus(status: AppStatus) : void
}

export { Position, Themes, AppStatus, IMain }

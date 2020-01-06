enum Position { left = "left", right = "right" };
enum Themes { dark = "dark", light = "light" };
enum AppStatus { ready = 0, busy = 1, error = 2 };

interface IMain {
    moveToolbar(position: Position, ...args: any[]) : boolean
}

export { Position, Themes, AppStatus, IMain }

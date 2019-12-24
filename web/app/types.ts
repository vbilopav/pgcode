enum Positions { left = "left", right = "right" };
enum Themes { dark = "dark", light = "light" };

interface IMain {
    moveToolbar(position: Positions) : boolean
}

export { Positions, Themes, IMain }

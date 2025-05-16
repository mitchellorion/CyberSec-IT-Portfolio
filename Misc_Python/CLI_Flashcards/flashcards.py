import json
import os
import random
import sys
import time

def rgb(r, g, b):
    return f"\033[38;2;{r};{g};{b}m"

def reset():
    return "\033[0m"

NEON_GREEN = rgb(138, 206, 0)       # #8ACE00 neon green text
ELECTRIC_BLUE = rgb(0, 255, 255)    # bright electric blue border
BRIGHT = "\033[1m"
DIM = "\033[2m"

FLASHCARD_FILE = "flashcards.json"

if os.path.exists(FLASHCARD_FILE):
    with open(FLASHCARD_FILE, "r") as f:
        flashcards = json.load(f)
else:
    flashcards = []

def save_flashcards():
    with open(FLASHCARD_FILE, "w") as f:
        json.dump(flashcards, f, indent=2)

def flicker_text(text, times=6, interval=0.15):
    """Flicker the text on and off in place inside the border."""
    reset_code = reset()
    width = 57 - 2
    side = "║"
    for _ in range(times):
        # print text
        print(ELECTRIC_BLUE + side + NEON_GREEN + BRIGHT + text.center(width) + ELECTRIC_BLUE + side + reset_code, end='\r', flush=True)
        time.sleep(interval)
        # clear text line
        print(ELECTRIC_BLUE + side + " " * width + side + reset_code, end='\r', flush=True)
        time.sleep(interval)
    # print text final time
    print(ELECTRIC_BLUE + side + NEON_GREEN + BRIGHT + text.center(width) + ELECTRIC_BLUE + side + reset_code)

def show_welcome():
    width = 57
    top_bot = "═"
    side = "║"
    space = " "
    reset_code = reset()

    print("\n" * 2)
    print(ELECTRIC_BLUE + BRIGHT + top_bot * width + reset_code)
    print(ELECTRIC_BLUE + side + space * (width - 2) + side + reset_code)

    title = "FLASHCARD SYSTEM TERMINAL"
    title_line = title.center(width - 2)
    print(ELECTRIC_BLUE + side + NEON_GREEN + BRIGHT + title_line + ELECTRIC_BLUE + side + reset_code)

    print(ELECTRIC_BLUE + side + space * (width - 2) + side + reset_code)

    # Flicker "Loading modules..."
    flicker_text("Loading modules...")

    # Print "Ready." in neon green and centered
    ready_line = "Ready."
    print(ELECTRIC_BLUE + side + DIM + NEON_GREEN + ready_line.center(width - 2) + ELECTRIC_BLUE + side + reset_code)

    print(ELECTRIC_BLUE + side + space * (width - 2) + side + reset_code)
    print(ELECTRIC_BLUE + BRIGHT + top_bot * width + reset_code + "\n")

def add_flashcard():
    print(NEON_GREEN + BRIGHT + "\n✨ Let's create a new flashcard!" + reset())
    question = input(NEON_GREEN + "Enter the question: " + reset())
    answer = input(NEON_GREEN + "Enter the answer: " + reset())
    flashcards.append({"question": question, "answer": answer})
    save_flashcards()
    print(NEON_GREEN + "✅ Flashcard saved!\n" + reset())

def take_quiz():
    if not flashcards:
        print("\033[91m😢 No flashcards available. Add some first!\n\033[0m")
        return
    cards = flashcards[:]
    random.shuffle(cards)
    print(NEON_GREEN + BRIGHT + "\n🎯 Quiz time! Let's test your knowledge." + reset())
    for card in cards:
        print(NEON_GREEN + "\n❓ Question:", card["question"] + reset())
        user_input = input(NEON_GREEN + "Your answer: " + reset())
        if user_input.strip().lower() == card["answer"].strip().lower():
            print(NEON_GREEN + "🎉 Wooooot! Nailed it!" + reset())
        else:
            print("\033[91m😬 soooo close!\033[0m")
            print(NEON_GREEN + "👉 Correct answer: " + NEON_GREEN + card["answer"] + reset())
    print(NEON_GREEN + "\n🏁 End of quiz!\n" + reset())

def main():
    while True:
        show_welcome()
        print(f"{NEON_GREEN}1.{reset()} Take Quiz")
        print(f"{NEON_GREEN}2.{reset()} Add Flashcard")
        print(f"{NEON_GREEN}3.{reset()} Exit")
        print(ELECTRIC_BLUE + "─" * 57 + reset())
        choice = input("Choose an option (1-3): ")

        if choice == "1":
            take_quiz()
        elif choice == "2":
            add_flashcard()
        elif choice == "3":
            print(NEON_GREEN + "\n👋 Peace out, brainiac!\n" + reset())
            break
        else:
            print("\033[91m❌ Invalid option. Try again!\033[0m")

if __name__ == "__main__":
    main()

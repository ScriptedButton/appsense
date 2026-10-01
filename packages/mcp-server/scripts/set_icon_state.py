"""Write a SpringBoard icon state read from stdin, then print the resulting state as JSON.

Usage: python set_icon_state.py <udid> < state.json
"""

import json
import sys
import time

from pymobiledevice3.lockdown import create_using_usbmux
from pymobiledevice3.services.springboard import SpringBoardServicesService


def main() -> None:
    udid = sys.argv[1]
    state = json.load(sys.stdin)
    SpringBoardServicesService(create_using_usbmux(serial=udid)).set_icon_state(state)
    # SpringBoard applies the new state asynchronously.
    time.sleep(2)
    after = SpringBoardServicesService(create_using_usbmux(serial=udid)).get_icon_state()
    json.dump(after, sys.stdout, default=str)


if __name__ == "__main__":
    main()

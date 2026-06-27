# PBX Connector

This directory contains the specific drivers/scripts to communicate with the Phonik PBX system.

## Communication Method
The Pi Zero 2 W will connect to the Phonik PBX. We will need to implement the specific protocol (likely over Serial RS-232 or TCP/IP) to send commands like:
- `Turn ON Room 101`
- `Turn OFF Room 102`

## Implementation Details
- This should ideally be a standalone service or script that the Backend can invoke or communicate with (e.g., via MQTT or local sockets).
- Detailed protocol commands should be documented here once reverse-engineered or provided by the manufacturer.

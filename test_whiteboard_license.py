#!/usr/bin/env python3
"""Test that the tldraw license message is hidden on the public profile"""

from playwright.sync_api import sync_playwright
import sys

def test_license_hidden():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))

        # Navigate to profile page
        print("Navigating to http://localhost:3000/profile...")
        page.goto('http://localhost:3000/profile', wait_until='networkidle')

        # Wait a bit for any dynamic content
        page.wait_for_timeout(2000)

        # Take full page screenshot
        print("Taking screenshot of profile page...")
        page.screenshot(path='/tmp/profile_page.png', full_page=True)

        # Check if whiteboard is visible
        whiteboard = page.locator('.tldraw').first
        if whiteboard.count() > 0:
            print("✓ Whiteboard component found on page")

            # Take screenshot of just the whiteboard area
            whiteboard.screenshot(path='/tmp/whiteboard_area.png')

            # Check for license/watermark elements
            license_elements = [
                '.tldraw__license',
                '.tlui-watermark',
                '.tlui-watermark__link',
                '[class*="watermark"]',
                '[class*="license"]',
                'a[href*="tldraw.com"]',
                'a[href*="license"]'
            ]

            found_license = False
            for selector in license_elements:
                elements = page.locator(selector).all()
                if elements:
                    for elem in elements:
                        if elem.is_visible():
                            print(f"✗ WARNING: Visible license element found: {selector}")
                            found_license = True
                        else:
                            print(f"✓ License element hidden: {selector}")

            if not found_license:
                print("✓ No visible license/watermark elements found!")

            # Check for text content containing "license"
            page_content = page.content().lower()
            if 'get a license' in page_content:
                print("✗ WARNING: 'get a license' text found in page content")
                # Try to find the exact element
                all_text = page.locator('text=/.*license.*/i').all()
                for elem in all_text:
                    if elem.is_visible():
                        print(f"  Found visible text: {elem.text_content()[:100]}")
            else:
                print("✓ No 'get a license' text found in page")
        else:
            print("ℹ No whiteboard component found (may not be enabled for this profile)")

        # Print any console errors
        errors = [msg for msg in console_messages if 'error' in msg.lower()]
        if errors:
            print("\n⚠ Console errors detected:")
            for error in errors:
                print(f"  {error}")
        else:
            print("\n✓ No console errors")

        print("\nScreenshots saved to:")
        print("  /tmp/profile_page.png")
        if whiteboard.count() > 0:
            print("  /tmp/whiteboard_area.png")

        browser.close()

if __name__ == '__main__':
    test_license_hidden()

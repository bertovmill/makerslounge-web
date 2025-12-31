#!/usr/bin/env python3
"""Test that the tldraw license message is hidden on public profiles"""

from playwright.sync_api import sync_playwright
import sys

def test_public_profiles():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        console_messages = []
        errors = []
        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: errors.append(str(err)))

        print("Navigating to homepage...")
        page.goto('http://localhost:3000', wait_until='networkidle')
        page.wait_for_timeout(1000)

        # Take homepage screenshot
        page.screenshot(path='/tmp/homepage.png', full_page=True)
        print("✓ Homepage loaded")

        # Try to find profile links
        profile_links = page.locator('a[href*="/profile/"], a[href*="/p/"]').all()
        print(f"Found {len(profile_links)} profile links")

        whiteboard_found = False

        # Test a few profile links
        for i, link in enumerate(profile_links[:3]):  # Test up to 3 profiles
            try:
                href = link.get_attribute('href')
                if href:
                    print(f"\nTesting profile {i+1}: {href}")
                    page.goto(f'http://localhost:3000{href}', wait_until='networkidle')
                    page.wait_for_timeout(2000)

                    # Check if whiteboard exists
                    whiteboard = page.locator('.tldraw').first
                    if whiteboard.count() > 0:
                        print(f"  ✓ Whiteboard found on {href}!")
                        whiteboard_found = True

                        # Take screenshot of this profile
                        page.screenshot(path=f'/tmp/profile_{i+1}_full.png', full_page=True)
                        whiteboard.screenshot(path=f'/tmp/profile_{i+1}_whiteboard.png')

                        # Check for license elements
                        page_content = page.content()

                        # Check if "Get a license" or "tldraw.com" text is visible
                        license_text = page.locator('text=/get.*license|tldraw\\.com/i').all()
                        visible_license = [elem for elem in license_text if elem.is_visible()]

                        if visible_license:
                            print(f"  ✗ WARNING: Found {len(visible_license)} visible license elements:")
                            for elem in visible_license:
                                text = elem.text_content()[:100]
                                print(f"    - {text}")
                        else:
                            print(f"  ✓ No visible license text found!")

                        # Check specific CSS classes
                        license_classes = [
                            '.tldraw__license',
                            '.tlui-watermark',
                            'a[href*="tldraw.com"]',
                        ]

                        for selector in license_classes:
                            elements = page.locator(selector).all()
                            visible = [e for e in elements if e.is_visible()]
                            if visible:
                                print(f"  ✗ WARNING: Found visible {selector}: {len(visible)}")
                            else:
                                hidden = [e for e in elements if not e.is_visible()]
                                if hidden:
                                    print(f"  ✓ {selector} hidden (found {len(hidden)} hidden elements)")

                        break  # Only test the first profile with whiteboard

            except Exception as e:
                print(f"  Error testing {href}: {e}")

        if not whiteboard_found:
            print("\n⚠ No whiteboard found on any public profiles")
            print("  Testing /profile/[id] directly might require authentication")

        # Print console errors
        if errors:
            print("\n⚠ Page errors detected:")
            for error in errors:
                print(f"  {error}")

        console_errors = [msg for msg in console_messages if '[error]' in msg]
        if console_errors:
            print("\n⚠ Console errors:")
            for error in console_errors:
                print(f"  {error}")

        print("\nScreenshots saved to /tmp/")

        browser.close()

if __name__ == '__main__':
    test_public_profiles()

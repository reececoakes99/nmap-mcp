import unittest
from unittest.mock import patch
import subprocess

from server import do_nmap


class DoNmapTests(unittest.TestCase):
    def test_rejects_invalid_target(self):
        result = do_nmap("bad;target")
        self.assertFalse(result["ok"])
        self.assertIn("Invalid target", result["error"])

    @patch("server.subprocess.run")
    def test_returns_structured_results(self, mock_run):
        mock_run.return_value = subprocess.CompletedProcess(
            args=["nmap", "-oX", "-", "127.0.0.1"],
            returncode=0,
            stdout=(
                "<?xml version='1.0'?>"
                "<nmaprun>"
                "<host><status state='up'/>"
                "<address addr='127.0.0.1'/>"
                "<ports><port protocol='tcp' portid='80'>"
                "<state state='open'/>"
                "<service name='http' product='nginx' version='1.2'/>"
                "</port></ports></host>"
                "</nmaprun>"
            ),
            stderr="",
        )

        result = do_nmap("127.0.0.1", ["-sV"])
        self.assertTrue(result["ok"])
        self.assertEqual(result["target"], "127.0.0.1")
        self.assertEqual(result["results"]["hosts"][0]["ports"][0]["service"], "http")


if __name__ == "__main__":
    unittest.main()

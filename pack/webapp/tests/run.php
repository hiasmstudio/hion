<?php

	$dir = "./projects/";
	if ($dh = opendir($dir)) {
		$projects = 0;
		$failed = 0;
		$ok = 0;
		while (($file = readdir($dh)) !== false) {
			if(!is_dir($dir . $file)) {
				$projects ++;
				
				$out = array();
				//exec("sudo -u ".SUDO_USER." hiasm5 -m $mode $file", $out, $state);
				exec("hiasm5 -m make-test $dir$file", $out, $state);

				$md5Hash = substr($out[0], 0, 32);
				$hash = "./hash/$file.md5";
				
				if($state || file_exists($hash) && file_get_contents($hash) != $md5Hash) {
					echo join("\n", $out);
					if($state)
						echo "\nExit code: $state\n";
					echo "[\033[1;31mFAILED\033[0m] $file\n";
					$failed ++;
				}
				else {
					if(!file_exists($hash))
						file_put_contents($hash, $md5Hash);
					echo "[  \033[1;32mOK\033[0m  ] $file\n";
					$ok ++;
				}
			}
		}
		closedir($dh);
		
		echo "Total projects: $projects (\033[1;32m$ok\033[0m/\033[1;31m$failed\033[0m)\n";
	}


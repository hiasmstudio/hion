<?php
	require_once './class.Diff.php';

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

				$hash = "./hash/$file.js";
				$index = 1;
				$code = "";
				if($out[$index] == "CODEBEGIN") {
					while($out[++$index] != "CODEEND") {
						$code .= $out[$index]."\n";
					}
				}
				
				if($state || file_exists($hash) && ($f = file_get_contents($hash)) != $code) {
					echo "[\033[1;31mFAILED\033[0m] $file\n";
					
					$diff = Diff::compare($f, $code);
					foreach($diff as $line) {
						if($line[1]) {
							echo ($line[1] == 1 ? "-" : "+").$line[0]."\n";
						}
					}
					
					echo join("\n", array_slice($out, $index+1));
					if($state)
						echo "\nExit code: $state\n";
					$failed ++;
					echo "\n\n";
				}
				else {
					if(!file_exists($hash))
						file_put_contents($hash, $code);
					echo "[  \033[1;32mOK\033[0m  ] $file\n";
					$ok ++;
				}
			}
		}
		closedir($dh);
		
		echo "Total projects: $projects (\033[1;32m$ok\033[0m/\033[1;31m$failed\033[0m)\n";
	}


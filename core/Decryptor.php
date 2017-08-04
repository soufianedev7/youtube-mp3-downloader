<?php

/*
  Created by: krakas
  On: 17.06.2016

*/

namespace uniqueX;

class Decryptor {

    private static function QF(&$a) {

        $a = array_reverse($a);

    }

    private static function sE(&$a, $b) {

        $c = $a[0];
        $a[0] = $a[$b % count($a)];
        $a[$b] = $c;

    }

    private static function Oy(&$a, $b) {

        array_splice($a, 0, $b);

    }

    private static function pr($a) {

        $a = str_split($a);

        self::QF($a);
        self::Oy($a, 3);
        self::sE($a, 34);
        
        return implode("", $a);

    }

    public static function decryptSig($s, $playerID = "") {
		return self::pr($s);
    }
	
	private static function swap_1588($param1, $param2)
		{
			$_loc3_ = $param1[0];
			$_loc4_ = $param1[$param2%strlen($param1)];
			$param1[0]=$_loc4_;
			$param1[$param2]=$_loc3_;
			return $param1;
		}	

}

?>

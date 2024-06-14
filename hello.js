import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;

public class NumberFormatter {

    public static String formatNumber(String input) {
        // Default number to 999 if input is not a valid number or greater than 999
        int number = NumberUtils.toInt(input, 999);
        
        if (number > 999) {
            number = 999;
        }
        
        // Convert the number to a string and pad it to length 3 with leading zeros
        String paddedNumberStr = StringUtils.leftPad(Integer.toString(number), 3, '0');
        
        // Append 'M' to the padded string
        String result = paddedNumberStr + "M";
        
        return result;
    }

    public static void main(String[] args) {
        // Test cases
        System.out.println(formatNumber("0000"));   // Output: 000M
        System.out.println(formatNumber("0004"));   // Output: 004M
        System.out.println(formatNumber("9999"));   // Output: 999M
        System.out.println(formatNumber("abcd"));   // Output: 999M
        System.out.println(formatNumber("12345"));  // Output: 999M
        System.out.println(formatNumber("1000"));   // Output: 999M
        System.out.println(formatNumber("999"));    // Output: 999M
    }
}
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Calendar;

public class DateConverter {
    public static void main(String[] args) {
        String inputDateStr = "12341234";  // Change this to test other dates
        if (isValidDate(inputDateStr)) {
            SimpleDateFormat inputFormat = new SimpleDateFormat("yyyyMMdd");
            SimpleDateFormat outputFormat = new SimpleDateFormat("yyyy-MM-dd");

            try {
                Date date = inputFormat.parse(inputDateStr);
                String outputDateStr = outputFormat.format(date);
                System.out.println("Converted Date: " + outputDateStr);
            } catch (ParseException e) {
                e.printStackTrace();
            }
        } else {
            System.out.println("Invalid date: " + inputDateStr);
        }
    }

    public static boolean isValidDate(String dateStr) {
        if (dateStr.length() != 8) {
            return false;
        }

        String yearStr = dateStr.substring(0, 4);
        String monthStr = dateStr.substring(4, 6);
        String dayStr = dateStr.substring(6, 8);

        int year = Integer.parseInt(yearStr);
        int month = Integer.parseInt(monthStr);
        int day = Integer.parseInt(dayStr);

        if (month < 1 || month > 12) {
            return false;
        }

        Calendar calendar = Calendar.getInstance();
        calendar.setLenient(false);
        calendar.set(Calendar.YEAR, year);
        calendar.set(Calendar.MONTH, month - 1); // Calendar months are 0-based
        calendar.set(Calendar.DAY_OF_MONTH, day);

        try {
            Date date = calendar.getTime();
        } catch (Exception e) {
            return false;
        }

        return true;
    }
}
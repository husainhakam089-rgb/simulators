package iq.albaraka.contracts;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * عميل IPP مبسّط لإرسال ملف PDF إلى طابعة على الشبكة مباشرة (بلا نافذة نظام).
 * الطريقة الثانية في خطة الطباعة — تُجرَّب على الطابعة الفعلية، وإن لم تنجح
 * يبقى نظام الطباعة المدمج في أندرويد هو البديل.
 *
 * صنف Java خالص بلا اعتماد على أندرويد، ليسهل اختباره.
 */
public final class IppClient {

    /* وسوم IPP */
    private static final byte TAG_OPERATION_ATTRIBUTES = 0x01;
    private static final byte TAG_END_OF_ATTRIBUTES = 0x03;
    private static final byte TAG_CHARSET = 0x47;
    private static final byte TAG_NATURAL_LANGUAGE = 0x48;
    private static final byte TAG_URI = 0x45;
    private static final byte TAG_NAME_WITHOUT_LANGUAGE = 0x42;
    private static final byte TAG_MIME_MEDIA_TYPE = 0x49;

    private static final short OP_PRINT_JOB = 0x0002;
    private static final int CONNECT_TIMEOUT_MS = 8000;
    private static final int READ_TIMEOUT_MS = 60000;

    private IppClient() {
    }

    /** نتيجة الإرسال. */
    public static final class Result {
        public final boolean ok;
        public final int statusCode;
        public final String message;

        Result(boolean ok, int statusCode, String message) {
            this.ok = ok;
            this.statusCode = statusCode;
            this.message = message;
        }
    }

    /**
     * إرسال ملف PDF إلى الطابعة.
     *
     * @param host    عنوان الطابعة، مثل 192.168.1.50
     * @param port    المنفذ، عادة 631
     * @param queue   مسار الطابور، عادة ipp/print
     * @param pdf     الملف المراد طبعه
     * @param jobName اسم المهمة كما يظهر في الطابعة
     * @param user    اسم المستخدم المرسِل
     */
    public static Result printPdf(String host, int port, String queue, File pdf, String jobName, String user)
            throws IOException {
        String path = queue == null || queue.isEmpty() ? "ipp/print" : queue;
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        String printerUri = "ipp://" + host + ":" + port + "/" + path;
        byte[] header = buildPrintJobHeader(printerUri, jobName, user);

        URL url = new URL("http://" + host + ":" + port + "/" + path);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        try {
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(CONNECT_TIMEOUT_MS);
            conn.setReadTimeout(READ_TIMEOUT_MS);
            conn.setRequestProperty("Content-Type", "application/ipp");
            conn.setFixedLengthStreamingMode(header.length + (int) pdf.length());

            try (OutputStream out = conn.getOutputStream(); InputStream in = new FileInputStream(pdf)) {
                out.write(header);
                byte[] buf = new byte[16 * 1024];
                int n;
                while ((n = in.read(buf)) > 0) {
                    out.write(buf, 0, n);
                }
                out.flush();
            }

            int http = conn.getResponseCode();
            InputStream body = http >= 400 ? conn.getErrorStream() : conn.getInputStream();
            byte[] response = readAll(body);
            if (http != 200) {
                return new Result(false, http, "الطابعة ردّت بحالة HTTP " + http);
            }
            int ippStatus = response.length >= 4 ? ((response[2] & 0xFF) << 8) | (response[3] & 0xFF) : -1;
            // أي رمز أقل من 0x0100 يعني نجاحاً في IPP.
            boolean ok = ippStatus >= 0 && ippStatus < 0x0100;
            return new Result(ok, ippStatus, ok ? "أُرسلت المهمة" : "رفضت الطابعة المهمة (رمز " + ippStatus + ")");
        } finally {
            conn.disconnect();
        }
    }

    /** ترويسة عملية Print-Job مع صفاتها. */
    static byte[] buildPrintJobHeader(String printerUri, String jobName, String user) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        DataOutputStream out = new DataOutputStream(bytes);

        out.writeByte(2); // إصدار IPP 2.0
        out.writeByte(0);
        out.writeShort(OP_PRINT_JOB);
        out.writeInt(1); // رقم الطلب

        out.writeByte(TAG_OPERATION_ATTRIBUTES);
        writeAttribute(out, TAG_CHARSET, "attributes-charset", "utf-8");
        writeAttribute(out, TAG_NATURAL_LANGUAGE, "attributes-natural-language", "en");
        writeAttribute(out, TAG_URI, "printer-uri", printerUri);
        writeAttribute(out, TAG_NAME_WITHOUT_LANGUAGE, "requesting-user-name", user == null ? "albaraka" : user);
        writeAttribute(out, TAG_NAME_WITHOUT_LANGUAGE, "job-name", jobName == null ? "document" : jobName);
        writeAttribute(out, TAG_MIME_MEDIA_TYPE, "document-format", "application/pdf");
        out.writeByte(TAG_END_OF_ATTRIBUTES);

        out.flush();
        return bytes.toByteArray();
    }

    private static void writeAttribute(DataOutputStream out, byte tag, String name, String value) throws IOException {
        byte[] n = name.getBytes(StandardCharsets.UTF_8);
        byte[] v = value.getBytes(StandardCharsets.UTF_8);
        out.writeByte(tag);
        out.writeShort(n.length);
        out.write(n);
        out.writeShort(v.length);
        out.write(v);
    }

    private static byte[] readAll(InputStream in) throws IOException {
        if (in == null) {
            return new byte[0];
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = in.read(buf)) > 0) {
            out.write(buf, 0, n);
        }
        in.close();
        return out.toByteArray();
    }
}

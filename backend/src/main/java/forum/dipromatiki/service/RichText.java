package forum.dipromatiki.service;

import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;

// Formatted posts arrive as HTML from the editor; only a small set of formatting tags is kept.
final class RichText {

    private static final Safelist SAFELIST = new Safelist()
            .addTags("p", "br", "strong", "b", "em", "i", "u", "s", "del", "code", "pre", "blockquote",
                    "ul", "ol", "li", "h1", "h2", "h3", "a")
            .addAttributes("a", "href")
            .addProtocols("a", "href", "http", "https", "mailto")
            .addEnforcedAttribute("a", "rel", "noopener noreferrer nofollow")
            .addEnforcedAttribute("a", "target", "_blank");

    // Same test the frontend uses: anything else is a plain-text post and is left untouched.
    private static final Pattern HTML_START =
            Pattern.compile("^\\s*<(p|h[1-6]|ul|ol|blockquote|pre)[\\s>]", Pattern.CASE_INSENSITIVE);

    private RichText() {}

    static String clean(String content) {
        if (!HTML_START.matcher(content).find()) {
            return content;
        }
        String cleaned = Jsoup.clean(content, "", SAFELIST, new Document.OutputSettings().prettyPrint(false));
        if (Jsoup.parse(cleaned).text().isBlank()) {
            throw new IllegalArgumentException("Το μήνυμα είναι υποχρεωτικό");
        }
        return cleaned;
    }
}

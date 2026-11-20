package forum.dipromatiki.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class AcceptanceCriterion {

    @Column(nullable = false, length = 200)
    private String text;

    @Column(nullable = false)
    private boolean done;

    public AcceptanceCriterion() {}

    public AcceptanceCriterion(String text, boolean done) {
        this.text = text;
        this.done = done;
    }

    public String getText() { return text; }
    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }
}
